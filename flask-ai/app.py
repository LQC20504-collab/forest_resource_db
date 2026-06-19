from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import math

app = Flask(__name__)
CORS(app)

# 树种形数表（模拟，基于常见树种经验值）
# 形数 f = 树干材积与同底同高圆柱体体积之比，约 0.35~0.60
FORM_FACTOR_BY_SPECIES = {
    1: 0.45,   # 马尾松
    2: 0.42,   # 杉木
    3: 0.38,   # 栎类
    4: 0.48,   # 硬阔类
    5: 0.52,   # 软阔类
    6: 0.40,   # 国外松
    7: 0.44,   # 针混
    8: 0.46,   # 阔混
    9: 0.50,   # 竹林
}


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'forest-resource-ai'})


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    plot_id = data.get('plot_id', 1)
    model_id = data.get('model_id', 1)
    trees = data.get('trees', [])

    if not trees:
        # 兼容旧格式：用 avg_dbh / avg_height / species_count
        avg_dbh = data.get('avg_dbh', 20.0)
        avg_height = data.get('avg_height', 15.0)
        species_count = data.get('species_count', 1)
        tree_list = [{'dbh': avg_dbh, 'height': avg_height}]
    else:
        species_ids = {t.get('species_id') for t in trees if t.get('species_id') is not None}
        species_count = len(species_ids) if species_ids else 1
        avg_dbh = sum(t['dbh'] for t in trees) / len(trees)
        avg_height = sum(t['height'] for t in trees) / len(trees)
        tree_list = trees

    total_volume = 0.0
    for t in tree_list:
        dbh = t['dbh']
        height = t['height']

        # 二元材积公式: V = 0.00005 × dbh² × height × 形数
        # 形数约 0.38~0.52，使用树种对应形数（若无则取 0.46）
        species_id = t.get('species_id', None)
        if species_id and species_id in FORM_FACTOR_BY_SPECIES:
            form_factor = FORM_FACTOR_BY_SPECIES[species_id]
        else:
            form_factor = 0.46

        # 基础材积
        vol = 0.00005 * (dbh ** 2) * height * form_factor

        # 模型预测在实测基础上加微小随机偏差（±5%），模拟模型合理误差
        noise_pct = random.gauss(0, 0.03)  # 标准差3%
        vol = vol * (1 + noise_pct)

        total_volume += max(vol, 0.01)

    total_volume = round(total_volume, 4)

    # 置信度：基于平均值
    dbh_score = 1.0 - min(abs(avg_dbh - 22.0) / 28.0, 0.3)
    ht_score = 1.0 - min(abs(avg_height - 16.0) / 24.0, 0.3)
    confidence = round(0.70 + (dbh_score * 0.15 + ht_score * 0.15), 4)
    confidence = min(max(confidence, 0.70), 0.95)

    return jsonify({
        'predicted_volume': total_volume,
        'confidence': confidence
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
