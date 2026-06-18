/**
 * operation-logs.js — 森林资源调查系统 操作日志查看
 *
 * Responsibilities:
 *   1. Auth guard (check jwt_token -> redirect login.html)
 *   2. Fetch GET /api/operation-logs (all logs) and render table
 *   3. Fetch GET /api/operation-logs/user/{userId} (filter by user)
 *   4. Client-side pagination for log list
 *   5. Toast notifications for errors
 *
 * Dependencies:
 *   - operation-logs.html (DOM structure, inline CSS)
 *   - Backend: OperationLogController
 */

(function () {
  'use strict';

  /* ==================================================================
   *  Constants
   * ================================================================== */
  var TOKEN_KEY = 'jwt_token';
  var USERNAME_KEY = 'username';
  var PAGE_SIZE = 15;

  /* ==================================================================
   *  State
   * ================================================================== */
  var currentPage = 1;
  var totalPages = 0;
  var totalCount = 0;
  var allLogs = [];
  var currentMode = 'all';    /* 'all' or 'user' */

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

    var iconMap = {
      success: '\u2713',
      error: '\u2717',
      warning: '\u26A0'
    };

    var icon = document.createElement('span');
    icon.textContent = iconMap[type] || '\u2139';
    icon.style.fontSize = '16px';

    var text = document.createElement('span');
    text.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(text);
    container.appendChild(toast);

    /* Auto-dismiss after 3.5 seconds */
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

  function formatTime(str) {
    if (!str) return '—';
    /* If the string contains 'T', replace with space for readability */
    return str.indexOf('T') !== -1 ? str.replace('T', ' ') : str;
  }

  /* ==================================================================
   *  Data Fetching
   * ================================================================== */

  function showTableLoading() {
    var tbody = document.getElementById('logTableBody');
    if (!tbody) return;
    tbody.innerHTML =
      '<tr class="loading-row">' +
        '<td colspan="5" style="text-align:center;padding:32px;">' +
          '<div class="spinner"></div>' +
        '</td>' +
      '</tr>';

    var $paginationInfo = document.getElementById('paginationInfo');
    if ($paginationInfo) {
      $paginationInfo.textContent = '加载中...';
    }
    var $paginationControls = document.getElementById('paginationControls');
    if ($paginationControls) {
      $paginationControls.innerHTML = '';
    }
  }

  function fetchAllLogs() {
    showTableLoading();
    currentMode = 'all';
    currentPage = 1;

    fetch('/api/operation-logs', {
      method: 'GET',
      headers: getAuthHeaders()
    })
    .then(function (res) {
      return handleUnauthorized(res).json();
    })
    .then(function (data) {
      if (data.code === 200 && data.data) {
        allLogs = Array.isArray(data.data) ? data.data : [];
        totalCount = allLogs.length;
        totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
        renderPage();
      } else {
        allLogs = [];
        totalCount = 0;
        totalPages = 0;
        renderPage();
        showToast('error', data.message || '加载操作日志失败');
      }
    })
    .catch(function (err) {
      if (err.message !== 'UNAUTHORIZED') {
        allLogs = [];
        totalCount = 0;
        totalPages = 0;
        renderPage();
        showToast('error', '网络错误，无法加载操作日志');
      }
    });
  }

  function fetchLogsByUser(userId) {
    if (!userId || !userId.trim()) {
      showToast('warning', '请输入用户ID');
      return;
    }

    showTableLoading();
    currentMode = 'user';
    currentPage = 1;

    fetch('/api/operation-logs/user/' + encodeURIComponent(userId.trim()), {
      method: 'GET',
      headers: getAuthHeaders()
    })
    .then(function (res) {
      return handleUnauthorized(res).json();
    })
    .then(function (data) {
      if (data.code === 200 && data.data) {
        allLogs = Array.isArray(data.data) ? data.data : [];
        totalCount = allLogs.length;
        totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
        renderPage();
      } else {
        allLogs = [];
        totalCount = 0;
        totalPages = 0;
        renderPage();
        showToast('error', data.message || '查询用户日志失败');
      }
    })
    .catch(function (err) {
      if (err.message !== 'UNAUTHORIZED') {
        allLogs = [];
        totalCount = 0;
        totalPages = 0;
        renderPage();
        showToast('error', '网络错误，查询失败');
      }
    });
  }

  /* ==================================================================
   *  Rendering
   * ================================================================== */

  function renderPage() {
    var tbody = document.getElementById('logTableBody');
    if (!tbody) return;

    /* Slice current page */
    var startIdx = (currentPage - 1) * PAGE_SIZE;
    var pageLogs = allLogs.slice(startIdx, startIdx + PAGE_SIZE);

    /* Empty state */
    if (!pageLogs || pageLogs.length === 0) {
      tbody.innerHTML =
        '<tr class="empty-state">' +
          '<td colspan="5">' +
            '<p>' + (totalCount === 0 ? '暂无操作日志数据' : '暂无匹配的日志记录') + '</p>' +
          '</td>' +
        '</tr>';
    } else {
      var html = '';
      for (var i = 0; i < pageLogs.length; i++) {
        var log = pageLogs[i];
        html += '<tr>';
        html += '<td class="mono-id">' + log.logId + '</td>';
        html += '<td class="mono-id">' + escapeHtml('#' + String(log.userId)) + '</td>';
        html += '<td>' + escapeHtml(log.operation) + '</td>';
        html += '<td class="log-detail" title="' + escapeHtml(log.details || '') + '">' + escapeHtml(log.details) + '</td>';
        html += '<td>' + formatTime(log.operationTime) + '</td>';
        html += '</tr>';
      }
      tbody.innerHTML = html;
    }

    /* Update pagination info and controls */
    renderPaginationInfo();
    renderPaginationControls();
  }

  /* ==================================================================
   *  Pagination
   * ================================================================== */

  function renderPaginationInfo() {
    var $info = document.getElementById('paginationInfo');
    if (!$info) return;

    if (totalCount === 0) {
      $info.textContent = '共 0 条记录';
    } else {
      var startItem = (currentPage - 1) * PAGE_SIZE + 1;
      var endItem = Math.min(currentPage * PAGE_SIZE, totalCount);
      $info.textContent = '共 ' + totalCount + ' 条记录，显示第 ' + startItem + '-' + endItem + ' 条';
    }
  }

  function renderPaginationControls() {
    var $controls = document.getElementById('paginationControls');
    if (!$controls) return;

    if (totalPages <= 1) {
      $controls.innerHTML = '';
      return;
    }

    var html = '';

    /* Previous button */
    html += '<button class="pagination-btn" onclick="goToPage(' + (currentPage - 1) + ')"' +
            (currentPage <= 1 ? ' disabled' : '') + '>&lt;</button>';

    /* Page number buttons with ellipsis */
    var maxVisible = 5;
    var startPage, endPage;

    if (totalPages <= maxVisible + 2) {
      startPage = 1;
      endPage = totalPages;
    } else {
      startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      endPage = Math.min(totalPages, startPage + maxVisible - 1);
      if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
      }
    }

    if (startPage > 1) {
      html += '<button class="pagination-btn" onclick="goToPage(1)">1</button>';
      if (startPage > 2) {
        html += '<span class="pagination-ellipsis">...</span>';
      }
    }

    for (var i = startPage; i <= endPage; i++) {
      html += '<button class="pagination-btn' + (i === currentPage ? ' active' : '') +
              '" onclick="goToPage(' + i + ')">' + i + '</button>';
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        html += '<span class="pagination-ellipsis">...</span>';
      }
      html += '<button class="pagination-btn" onclick="goToPage(' + totalPages + ')">' + totalPages + '</button>';
    }

    /* Next button */
    html += '<button class="pagination-btn" onclick="goToPage(' + (currentPage + 1) + ')"' +
            (currentPage >= totalPages ? ' disabled' : '') + '>&gt;</button>';

    $controls.innerHTML = html;
  }

  function goToPage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    currentPage = page;
    renderPage();
  }

  /* ==================================================================
   *  Filter Mode
   * ================================================================== */

  function switchFilterMode(mode) {
    if (mode === currentMode) return;

    /* Update tab buttons */
    var btns = document.querySelectorAll('.filter-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.remove('active');
    }
    var activeBtn = document.querySelector('.filter-btn[data-mode="' + mode + '"]');
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    /* Toggle user input visibility */
    var userInput = document.getElementById('userFilterInput');
    if (userInput) {
      if (mode === 'user') {
        userInput.classList.remove('hidden');
      } else {
        userInput.classList.add('hidden');
      }
    }

    currentMode = mode;

    /* Fetch data */
    if (mode === 'all') {
      fetchAllLogs();
    }
  }

  function queryByUser() {
    var input = document.getElementById('userIdInput');
    if (!input) return;
    var userId = input.value.trim();
    if (!userId) {
      showToast('warning', '请输入用户ID');
      return;
    }
    fetchLogsByUser(userId);
  }

  /* ==================================================================
   *  Initialization
   * ================================================================== */

  function init() {
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

    /* 3. Fetch all logs on load */
    fetchAllLogs();
  }

  /* ==================================================================
   *  Bootstrap
   * ================================================================== */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ==================================================================
   *  Expose functions to global scope for inline HTML event handlers
   * ================================================================== */

  window.handleLogout = handleLogout;
  window.switchFilterMode = switchFilterMode;
  window.queryByUser = queryByUser;
  window.goToPage = goToPage;

})();
