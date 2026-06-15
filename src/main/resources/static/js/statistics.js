/* ========================================
   AI森林资源调查系统 — 分区统计页面脚本
   statistics.js
   ======================================== */

(function() {
  'use strict';

  /* ========== Auth & Config ========== */
  var TOKEN_KEY = 'jwt_token';
  var USERNAME_KEY = 'username';
  var API_BASE = '';

  /* ========== DOM Refs ========== */
  var $navLinks;
  var $usernameDisplay;
  var $btnLogout;

  /* Region filter */
  var $regionFilter;
  var $btnRefresh;

  /* Summary cards */
  var $statRegionCount;
  var $statPlotCount;
  var $statMeasuredVolume;
  var $statPredictedVolume;

  /* Statistics table */
  var $statsTableBody;
  var $statsEmpty;
  var $rowCount;

  /* AI Prediction */
  var $plotSelect;
  var $modelSelect;
  var $btnPredict;
  var $btnPredictAll;
  var $predictionResult;
  var $predictionResultBody;

  /* ========== Initialization ========== */
  function initStatistics() {
    /* Check JWT */
    var token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      redirectToLogin();
      return;
    }

    /* Cache DOM refs */
    $navLinks        = document.querySelectorAll('.navbar-nav a');
    $usernameDisplay = document.getElementById('usernameDisplay');
    $btnLogout       = document.getElementById('btnLogout');

    $regionFilter    = document.getElementById('regionFilter');
    $btnRefresh      = document.getElementById('btnRefresh');

    $statRegionCount      = document.getElementById('statRegionCount');
    $statPlotCount        = document.getElementById('statPlotCount');
    $statMeasuredVolume   = document.getElementById('statMeasuredVolume');
    $statPredictedVolume  = document.getElementById('statPredictedVolume');

    $statsTableBody  = document.getElementById('statsTableBody');
    $statsEmpty      = document.getElementById('statsEmpty');
    $rowCount        = document.getElementById('rowCount');

    $plotSelect      = document.getElementById('plotSelect');
    $modelSelect     = document.getElementById('modelSelect');
    $btnPredict      = document.getElementById('btnPredict');
    $btnPredictAll   = document.getElementById('btnPredictAll');
    $predictionResult      = document.getElementById('predictionResult');
    $predictionResultBody  = document.getElementById('predictionResultBody');

    /* Display username */
    if ($usernameDisplay) {
      $usernameDisplay.textContent = localStorage.getItem(USERNAME_KEY) || '用户';
    }

    /* Bind events */
    bindEvents();

    /* Load initial data */
    fetchRegions();
    fetchPlots();
    fetchModels();

    /* Load stats for all regions by default */
    fetchRegionStats(null);
  }

  /* ========== Event Binding ========== */
  function bindEvents() {
    /* Logout */
    if ($btnLogout) {
      $btnLogout.addEventListener('click', handleLogout);
    }

    /* Region filter change */
    if ($regionFilter) {
      $regionFilter.addEventListener('change', function() {
        var regionId = $regionFilter.value;
        if (regionId === 'all') {
          fetchRegionStats(null);
        } else {
          fetchRegionStats(regionId);
        }
      });
    }

    /* Refresh button */
    if ($btnRefresh) {
      $btnRefresh.addEventListener('click', function() {
        var regionId = $regionFilter ? $regionFilter.value : 'all';
        if (regionId === 'all') {
          fetchRegionStats(null);
        } else {
          fetchRegionStats(regionId);
        }
      });
    }

    /* AI Prediction button */
    if ($btnPredict) {
      $btnPredict.addEventListener('click', handlePrediction);
    }

    /* Batch predict button */
    if ($btnPredictAll) {
      $btnPredictAll.addEventListener('click', handleBatchPrediction);
    }
  }

  /* ========== Auth ========== */
  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + (getToken() || '')
    };
  }

  function redirectToLogin() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    window.location.href = 'login.html';
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    window.location.href = 'login.html';
  }

  /* ========== 401 Handler ========== */
  function handleUnauthorized(res) {
    if (res.status === 401) {
      redirectToLogin();
      throw new Error('UNAUTHORIZED');
    }
    return res;
  }

  /* ========== API: Regions ========== */
  function fetchRegions() {
    fetch(API_BASE + '/api/regions', {
      method: 'GET',
      headers: getAuthHeaders()
    })
    .then(function(res) {
      return handleUnauthorized(res).json();
    })
    .then(function(data) {
      if (data.code === 200 && data.data) {
        renderRegionOptions(data.data);
      } else {
        console.error('Failed to fetch regions:', data.message);
      }
    })
    .catch(function(err) {
      if (err.message !== 'UNAUTHORIZED') {
        console.error('fetchRegions error:', err);
      }
    });
  }

  function renderRegionOptions(regions) {
    if (!$regionFilter) return;

    /* Reset dropdown — keep default "全部区域" */
    $regionFilter.innerHTML = '<option value="all">全部区域</option>';

    if (!regions || regions.length === 0) return;

    regions.forEach(function(region) {
      var option = document.createElement('option');
      option.value = region.regionId || region.id;
      option.textContent = region.regionName || region.name || ('区域-' + (region.regionId || region.id));
      $regionFilter.appendChild(option);
    });
  }

  /* ========== API: Region Stats ========== */
  function fetchRegionStats(regionId) {
    setTableLoading(true);

    var url = API_BASE + '/api/statistics/regions';
    if (regionId) {
      url = API_BASE + '/api/statistics/regions/' + regionId;
    }

    fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    })
    .then(function(res) {
      return handleUnauthorized(res).json();
    })
    .then(function(data) {
      setTableLoading(false);
      if (data.code === 200 && data.data) {
        /* Normalize: if single region endpoint returns an object, wrap in array */
        var stats = Array.isArray(data.data) ? data.data : [data.data];
        renderTable(stats);
      } else {
        renderTable([]);
        console.error('Failed to fetch stats:', data.message);
      }
    })
    .catch(function(err) {
      setTableLoading(false);
      if (err.message !== 'UNAUTHORIZED') {
        renderTable([]);
        console.error('fetchRegionStats error:', err);
      }
    });
  }

  /* ========== Summary Cards ========== */
  function updateSummaryCards(stats) {
    if (!stats || stats.length === 0) {
      if ($statRegionCount) { $statRegionCount.textContent = '--'; }
      if ($statPlotCount) { $statPlotCount.textContent = '--'; }
      if ($statMeasuredVolume) { $statMeasuredVolume.innerHTML = '-- <small>m³</small>'; }
      if ($statPredictedVolume) { $statPredictedVolume.innerHTML = '-- <small>m³</small>'; }
      return;
    }

    var regionCount = stats.length;

    var totalPlots = 0;
    var totalMeasured = 0;
    var totalPredicted = 0;

    stats.forEach(function(row) {
      totalPlots += Number(row.plotCount || row.samplePlotCount || 0);
      totalMeasured += Number(row.totalMeasuredVolume || row.measuredVolume || 0);
      totalPredicted += Number(row.totalPredictedVolume || row.predictedVolume || 0);
    });

    if ($statRegionCount) { $statRegionCount.textContent = regionCount; }
    if ($statPlotCount) { $statPlotCount.textContent = totalPlots; }
    if ($statMeasuredVolume) { $statMeasuredVolume.innerHTML = formatNumber(totalMeasured) + ' <small>m³</small>'; }
    if ($statPredictedVolume) { $statPredictedVolume.innerHTML = formatNumber(totalPredicted) + ' <small>m³</small>'; }
  }

  /* ========== Table Rendering ========== */
  function setTableLoading(loading) {
    if (!$statsTableBody) return;
    if (loading) {
      $statsTableBody.innerHTML =
        '<tr class="empty-state">' +
          '<td colspan="6">' +
            '<span class="spinner" style="border-color:rgba(44,110,73,0.3);border-top-color:#2c6e49;"></span>' +
            ' 加载中...' +
          '</td>' +
        '</tr>';
      if ($statsEmpty) { $statsEmpty.classList.add('hidden'); }
    }
  }

  function renderTable(stats) {
    if (!$statsTableBody) return;

    /* Update summary cards */
    updateSummaryCards(stats);

    /* Update row count badge */
    if ($rowCount) {
      $rowCount.textContent = (stats ? stats.length : 0) + ' 条记录';
    }

    /* Empty state */
    if (!stats || stats.length === 0) {
      $statsTableBody.innerHTML = '';
      if ($statsEmpty) { $statsEmpty.classList.remove('hidden'); }
      return;
    }

    if ($statsEmpty) { $statsEmpty.classList.add('hidden'); }

    var html = '';
    stats.forEach(function(row) {
      html += '<tr>';
      html += '<td>' + escapeHtml(row.regionName || '-') + '</td>';
      html += '<td class="text-right">' + (row.plotCount != null ? row.plotCount : row.samplePlotCount != null ? row.samplePlotCount : '-') + '</td>';
      html += '<td class="text-right">' + (row.treeCount != null ? row.treeCount : row.totalTrees != null ? row.totalTrees : '-') + '</td>';
      html += '<td class="text-right">' + formatNumber(row.totalMeasuredVolume != null ? row.totalMeasuredVolume : row.measuredVolume != null ? row.measuredVolume : null) + '</td>';
      html += '<td class="text-right">' + formatNumber(row.totalPredictedVolume != null ? row.totalPredictedVolume : row.predictedVolume != null ? row.predictedVolume : null) + '</td>';
      html += '<td class="text-right">' + formatError(row.avgError != null ? row.avgError : row.averageError != null ? row.averageError : null) + '</td>';
      html += '</tr>';
    });

    $statsTableBody.innerHTML = html;
  }

  /* ========== API: Plots for Prediction ========== */
  function fetchPlots() {
    fetch(API_BASE + '/api/plots?page=1&size=100', {
      method: 'GET',
      headers: getAuthHeaders()
    })
    .then(function(res) {
      return handleUnauthorized(res).json();
    })
    .then(function(data) {
      if (data.code === 200 && data.data) {
        var plots = data.data.list || data.data.records || data.data || [];
        renderPlotOptions(plots);
      } else {
        console.error('Failed to fetch plots:', data.message);
      }
    })
    .catch(function(err) {
      if (err.message !== 'UNAUTHORIZED') {
        console.error('fetchPlots error:', err);
      }
    });
  }

  function renderPlotOptions(plots) {
    if (!$plotSelect) return;

    $plotSelect.innerHTML = '<option value="">-- 请选择样地 --</option>';

    if (!plots || plots.length === 0) return;

    plots.forEach(function(plot) {
      var option = document.createElement('option');
      option.value = plot.plotId || plot.id;
      option.textContent = (plot.plotCode || plot.code || plot.plotName || plot.name || ('样地-' + (plot.plotId || plot.id)));
      $plotSelect.appendChild(option);
    });
  }

  /* ========== API: Models ========== */
  function fetchModels() {
    fetch(API_BASE + '/api/models', {
      headers: getAuthHeaders()
    })
    .then(function(res) { return handleUnauthorized(res).json(); })
    .then(function(data) {
      if (data.code === 200 && data.data) {
        renderModelOptions(data.data);
      }
    })
    .catch(function(err) {
      console.error('fetchModels error:', err);
    });
  }

  function renderModelOptions(models) {
    if (!$modelSelect) return;
    $modelSelect.innerHTML = '';
    if (!models || models.length === 0) {
      $modelSelect.innerHTML = '<option value="">-- 暂无可用模型 --</option>';
      return;
    }
    models.forEach(function(m) {
      var option = document.createElement('option');
      option.value = m.modelId;
      option.textContent = m.modelName + ' (' + m.algorithm + ')';
      $modelSelect.appendChild(option);
    });
  }

  /* ========== API: AI Prediction ========== */
  function handlePrediction() {
    if (!$plotSelect) return;

    var plotId = $plotSelect.value;
    if (!plotId) {
      showPredictionToast('warn', '请先选择一个样地');
      return;
    }

    var modelId = $modelSelect ? $modelSelect.value : '';
    if (!modelId) {
      showPredictionToast('warn', '请先选择一个AI模型');
      return;
    }

    triggerPrediction(plotId, modelId);
  }

  function handleBatchPrediction() {
    var modelId = $modelSelect ? $modelSelect.value : '';
    if (!modelId) {
      showPredictionToast('warn', '请先选择一个AI模型');
      return;
    }
    triggerBatchPrediction(modelId);
  }

  function triggerBatchPrediction(modelId) {
    if ($btnPredictAll) {
      $btnPredictAll.disabled = true;
      $btnPredictAll.innerHTML = '<span class="spinner"></span> 批量预测中...';
    }
    if ($btnPredict) { $btnPredict.disabled = true; }

    showPredictionToast('warn', '正在批量预测全部样地，请稍候...');

    fetch(API_BASE + '/api/ai-predictions/predict-all?modelId=' + modelId, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    .then(function(res) { return handleUnauthorized(res).json(); })
    .then(function(data) {
      if ($btnPredictAll) {
        $btnPredictAll.disabled = false;
        $btnPredictAll.innerHTML = '&#9889; 批量预测全部';
      }
      if ($btnPredict) { $btnPredict.disabled = false; }

      if (data.code === 200 && data.data) {
        var count = data.data.length || 0;
        showPredictionToast('warn', '批量预测完成，共预测 ' + count + ' 个样地');
        /* 刷新统计数据 */
        refreshStats();
      } else {
        showPredictionToast('error', data.message || '批量预测失败');
      }
    })
    .catch(function(err) {
      if ($btnPredictAll) {
        $btnPredictAll.disabled = false;
        $btnPredictAll.innerHTML = '&#9889; 批量预测全部';
      }
      if ($btnPredict) { $btnPredict.disabled = false; }
      if (err.message !== 'UNAUTHORIZED') {
        showPredictionToast('error', '网络错误，无法连接服务器');
        console.error('triggerBatchPrediction error:', err);
      }
    });
  }

  function refreshStats() {
    var regionId = $regionFilter ? $regionFilter.value : 'all';
    if (regionId === 'all') {
      fetchRegionStats(null);
    } else {
      fetchRegionStats(regionId);
    }
  }

  function triggerPrediction(plotId, modelId) {
    setPredictionLoading(true);

    fetch(API_BASE + '/api/ai-predictions/predict/' + plotId + '?modelId=' + modelId, {
      method: 'POST',
      headers: getAuthHeaders()
    })
    .then(function(res) {
      return handleUnauthorized(res).json();
    })
    .then(function(data) {
      setPredictionLoading(false);
      if (data.code === 200 && data.data) {
        renderPredictionResult(data.data);
        /* 预测成功后刷新分区统计 */
        refreshStats();
      } else {
        showPredictionToast('warn', data.message || '预测失败，请稍后重试');
      }
    })
    .catch(function(err) {
      setPredictionLoading(false);
      if (err.message !== 'UNAUTHORIZED') {
        showPredictionToast('error', '网络错误，无法连接服务器');
        console.error('triggerPrediction error:', err);
      }
    });
  }

  function setPredictionLoading(loading) {
    if (!$btnPredict) return;
    if (loading) {
      $btnPredict.disabled = true;
      $btnPredict.innerHTML = '<span class="spinner"></span> 预测中...';
    } else {
      $btnPredict.disabled = false;
      $btnPredict.innerHTML = '&#9889; 触发AI预测';
    }
  }

  function renderPredictionResult(result) {
    if (!$predictionResult || !$predictionResultBody) return;

    var html = '';
    html += '<div class="prediction-item">';
    html += '<span class="prediction-label">预测蓄积量</span>';
    html += '<span class="prediction-value">' + formatNumber(result.predictedVolume) + ' m³</span>';
    html += '</div>';

    html += '<div class="prediction-item">';
    html += '<span class="prediction-label">置信度</span>';
    html += '<span class="prediction-value">' + formatPercent(result.confidence) + '</span>';
    html += '</div>';

    html += '<div class="prediction-item">';
    html += '<span class="prediction-label">模型</span>';
    html += '<span class="prediction-value">' + escapeHtml(result.model || '-') + '</span>';
    html += '</div>';

    $predictionResultBody.innerHTML = html;
    $predictionResult.classList.remove('hidden');

    /* Highlight pulse animation */
    $predictionResult.classList.remove('prediction-updated');
    void $predictionResult.offsetWidth;
    $predictionResult.classList.add('prediction-updated');
  }

  function showPredictionToast(type, message) {
    /* Reuse the prediction result area for toast messages */
    if ($predictionResult && $predictionResultBody) {
      $predictionResultBody.innerHTML =
        '<div class="prediction-toast prediction-toast--' + type + '">' +
          escapeHtml(message) +
        '</div>';
      $predictionResult.classList.remove('hidden');
      $predictionResult.classList.remove('prediction-updated');
    }
  }

  /* ========== Formatting Helpers ========== */
  function formatNumber(value) {
    if (value == null || isNaN(value)) return '-';
    return Number(value).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatError(value) {
    if (value == null || isNaN(value)) return '-';
    var sign = value >= 0 ? '+' : '';
    return sign + Number(value).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatPercent(value) {
    if (value == null || isNaN(value)) return '-';
    return (Number(value) * 100).toFixed(1) + '%';
  }

  function escapeHtml(str) {
    if (str == null) return '-';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ========== Bootstrap ========== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStatistics);
  } else {
    initStatistics();
  }

})();
