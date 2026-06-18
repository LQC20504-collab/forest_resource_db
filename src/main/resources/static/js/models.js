/**
 * models.js — AI 模型目录（只读）
 *
 * Responsibilities:
 *   1. Auth guard (check jwt_token -> redirect login.html)
 *   2. Fetch GET /api/models and render model cards
 *   3. Display R-squared (4 decimal), RMSE, feature tags
 *
 * Dependencies:
 *   - models.html (DOM structure, inline CSS)
 *   - Backend: ModelController
 */

(function () {
  'use strict';

  /* ==================================================================
   *  Constants
   * ================================================================== */

  var TOKEN_KEY = 'jwt_token';
  var USERNAME_KEY = 'username';

  /* ==================================================================
   *  Auth Helpers
   * ================================================================== */

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getAuthHeaders() {
    var token = getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + (token || '')
    };
  }

  function redirectToLogin() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    window.location.href = 'login.html';
  }

  function handleUnauthorized(res) {
    if (res.status === 401) {
      redirectToLogin();
      throw new Error('UNAUTHORIZED');
    }
    return res;
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    window.location.href = 'login.html';
  }

  /* ==================================================================
   *  Toast Notifications
   * ================================================================== */

  function showToast(type, message) {
    var container = document.getElementById('toastContainer');
    if (!container) return;

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;

    var icon = document.createElement('span');
    icon.textContent = '\u2139';
    icon.style.fontSize = '16px';

    var text = document.createElement('span');
    text.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(text);
    container.appendChild(toast);

    setTimeout(function () {
      if (toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(30px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(function () {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }
    }, 3500);
  }

  /* ==================================================================
   *  Formatting Helpers
   * ================================================================== */

  function escapeHtml(str) {
    if (str == null) return '-';
    var div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  function fmtR2(val) {
    if (val == null || isNaN(val)) return '—';
    return Number(val).toFixed(4);
  }

  function fmtRmse(val) {
    if (val == null || isNaN(val)) return '—';
    return Number(val).toFixed(4);
  }

  function r2Class(val) {
    if (val == null || isNaN(val)) return '';
    if (val >= 0.8) return 'high-r2';
    if (val >= 0.5) return 'medium-r2';
    return 'low-r2';
  }

  /* ==================================================================
   *  Data Fetching & Rendering
   * ================================================================== */

  function showLoading() {
    var container = document.getElementById('modelListContainer');
    if (!container) return;
    container.innerHTML =
      '<div class="loading-state">' +
        '<div class="spinner"></div>' +
      '</div>';
  }

  function fetchModels() {
    showLoading();

    return fetch('/api/models', {
      method: 'GET',
      headers: getAuthHeaders()
    })
    .then(function (res) {
      return handleUnauthorized(res).json();
    })
    .then(function (data) {
      if (data.code === 200 && data.data) {
        renderModels(data.data);
      } else {
        renderEmpty();
        showToast('error', data.message || '加载模型列表失败');
      }
    })
    .catch(function (err) {
      if (err.message !== 'UNAUTHORIZED') {
        renderEmpty();
        showToast('error', '网络错误，无法加载模型数据');
      }
    });
  }

  function renderModels(models) {
    var container = document.getElementById('modelListContainer');
    if (!container) return;

    if (!models || models.length === 0) {
      renderEmpty();
      return;
    }

    var html = '<div class="model-card-list">';

    models.forEach(function (m) {
      var r2 = m.rSquared;
      var r2Formatted = fmtR2(r2);
      var rmseFormatted = fmtRmse(m.rmse);
      var r2Css = r2Class(r2);

      html += '<div class="model-card">';

      /* Header: name + algorithm badge */
      html += '<div class="model-card-header">';
      html += '  <div style="display:flex;align-items:center;gap:10px;">';
      html += '    <span class="model-id-badge">#' + escapeHtml(m.modelId) + '</span>';
      html += '    <span class="model-card-name">' + escapeHtml(m.modelName) + '</span>';
      html += '  </div>';
      html += '  <span class="model-card-algo">' + escapeHtml(m.algorithm) + '</span>';
      html += '</div>';

      /* Body: metrics grid */
      html += '<div class="model-card-body">';

      html += '  <div class="model-metric">';
      html += '    <span class="model-metric-label">R' + '\u00B2</span>';
      html += '    <span class="model-metric-value ' + r2Css + '">' + r2Formatted + '</span>';
      html += '  </div>';

      html += '  <div class="model-metric">';
      html += '    <span class="model-metric-label">RMSE</span>';
      html += '    <span class="model-metric-value">' + rmseFormatted + '</span>';
      html += '  </div>';

      html += '</div>';

      /* Feature tags */
      if (m.featureList) {
        var features = m.featureList.split(',').map(function (f) { return f.trim(); }).filter(function (f) { return f; });
        if (features.length > 0) {
          html += '<div class="model-card-features">';
          html += '  <span class="feature-label">特征:</span>';
          features.forEach(function (feat) {
            html += '  <span class="feature-tag">' + escapeHtml(feat) + '</span>';
          });
          html += '</div>';
        }
      }

      /* Footer: created at */
      html += '<div class="model-card-footer">';
      html += '  <span class="model-card-date">' + (m.trainDate ? escapeHtml(m.trainDate) : '—') + '</span>';
      html += '</div>';

      html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
  }

  function renderEmpty() {
    var container = document.getElementById('modelListContainer');
    if (!container) return;
    container.innerHTML =
      '<div class="empty-state">' +
        '<p>暂无模型数据</p>' +
      '</div>';
  }

  /* ==================================================================
   *  Initialization
   * ================================================================== */

  function initModels() {
    /* 1. Auth guard */
    var token = getToken();
    if (!token) {
      redirectToLogin();
      return;
    }

    /* 2. Display username in navbar */
    var username = localStorage.getItem(USERNAME_KEY) || '用户';
    var $usernameDisplay = document.getElementById('navbarUsername');
    if ($usernameDisplay) {
      $usernameDisplay.textContent = username;
    }

    /* 3. Fetch models */
    fetchModels();
  }

  /* ==================================================================
   *  Bootstrap
   * ================================================================== */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModels);
  } else {
    initModels();
  }

})();
