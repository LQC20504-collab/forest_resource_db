/**
 * admin-regions.js — 森林资源调查系统 行政区管理
 *
 * Responsibilities:
 *   1. Auth guard (check jwt_token -> redirect login.html)
 *   2. Fetch GET /api/regions and render table
 *   3. CRUD: create (POST), update (PUT), delete (DELETE)
 *   4. Parent region dropdown for hierarchical regions
 *   5. Toast notifications, loading/empty/error states
 *
 * Dependencies:
 *   - admin-regions.html (DOM structure, inline CSS)
 *   - Backend: RegionController
 */

(function () {
  'use strict';

  var TOKEN_KEY = 'jwt_token';
  var USERNAME_KEY = 'username';

  var regions = [];
  var regionMap = {};
  var isEditMode = false;
  var deleteTarget = null;

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

  window.handleLogout = function () {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    window.location.href = 'login.html';
  };

  function showToast(type, message) {
    var container = document.getElementById('toastContainer');
    if (!container) return;

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;

    var iconMap = { success: '\u2713', error: '\u2717', warning: '\u26A0' };
    var icon = document.createElement('span');
    icon.textContent = iconMap[type] || '\u2139';
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
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
      }
    }, 3500);
  }

  function escapeHtml(str) {
    if (str == null) return '-';
    var div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  function fetchRegions() {
    fetch('/api/regions', {
      method: 'GET',
      headers: getAuthHeaders()
    })
    .then(function (res) { return handleUnauthorized(res).json(); })
    .then(function (data) {
      if (data.code === 200 && data.data) {
        regions = Array.isArray(data.data) ? data.data : [];
        buildRegionMap();
        renderTable();
        populateParentDropdown();
      } else {
        showToast('error', data.message || '加载区域列表失败');
        renderEmpty();
      }
    })
    .catch(function (err) {
      if (err.message !== 'UNAUTHORIZED') {
        showToast('error', '网络错误，无法加载区域数据');
        renderEmpty();
      }
    });
  }

  function buildRegionMap() {
    regionMap = {};
    regions.forEach(function (r) {
      regionMap[r.regionId] = r.name;
    });
  }

  function getParentName(region) {
    if (!region.parentId) return '—';
    return regionMap[region.parentId] || ('区域-' + region.parentId);
  }

  function renderTable() {
    var tbody = document.getElementById('regionTableBody');
    if (!tbody) return;

    if (!regions || regions.length === 0) {
      renderEmpty();
      return;
    }

    var html = '';
    regions.forEach(function (r) {
      html += '<tr>';
      html += '<td>' + r.regionId + '</td>';
      html += '<td class="region-name">' + escapeHtml(r.name) + '</td>';
      html += '<td>' + escapeHtml(getParentName(r)) + '</td>';
      html += '<td>' + (r.level != null ? 'Lv.' + r.level : '—') + '</td>';
      html += '<td class="actions">';
      html += '<button class="btn btn-ghost btn-sm" onclick="window.openEditModal(' + r.regionId + ')">编辑</button>';
      html += '<button class="btn btn-ghost btn-sm" onclick="window.openDeleteModal(' + r.regionId + ')">删除</button>';
      html += '</td>';
      html += '</tr>';
    });
    tbody.innerHTML = html;
  }

  function renderEmpty() {
    var tbody = document.getElementById('regionTableBody');
    if (!tbody) return;
    tbody.innerHTML =
      '<tr class="empty-state">' +
        '<td colspan="5">' +
          '<div class="empty-icon">&#128269;</div>' +
          '<p>暂无数据</p>' +
        '</td>' +
      '</tr>';
  }

  function populateParentDropdown() {
    var $sel = document.getElementById('formParentRegion');
    if (!$sel) return;
    $sel.innerHTML = '<option value="">（无 — 顶级区域）</option>';
    regions.forEach(function (r) {
      var opt = document.createElement('option');
      opt.value = r.regionId;
      opt.textContent = r.name;
      $sel.appendChild(opt);
    });
  }

  function getLevelLabel(level) {
    if (level === 1) return 'Lv.1 — 省级';
    if (level === 2) return 'Lv.2 — 市级';
    if (level === 3) return 'Lv.3 — 区县级';
    return 'Lv.' + level;
  }

  function autoSuggestLevel() {
    var parentId = document.getElementById('formParentRegion').value;
    var suggested;
    if (!parentId) {
      suggested = 1;
    } else {
      var parent = null;
      for (var i = 0; i < regions.length; i++) {
        if (regions[i].regionId == parentId) {
          parent = regions[i];
          break;
        }
      }
      suggested = parent ? (parent.level || 1) + 1 : 2;
    }
    /* Only auto-set if current selection is not manually changed */
    var $level = document.getElementById('formLevel');
    if (!$level.dataset.userChanged) {
      $level.value = Math.min(suggested, 3);
    }
    return suggested;
  }

  window.onParentChange = function () {
    autoSuggestLevel();
  };

  window.onLevelChange = function () {
    document.getElementById('formLevel').dataset.userChanged = 'true';
  };

  window.openCreateModal = function () {
    isEditMode = false;
    document.getElementById('formRegionId').value = '';
    document.getElementById('formRegionName').value = '';
    document.getElementById('formRegionCode').value = '';
    document.getElementById('formParentRegion').value = '';
    document.getElementById('formLevel').value = '1';
    document.getElementById('formLevel').dataset.userChanged = '';
    clearFormErrors();
    document.getElementById('formModalTitle').textContent = '新建区域';
    document.getElementById('formSubmitBtn').textContent = '保存';
    document.getElementById('formModalOverlay').classList.add('active');
  };

  window.openEditModal = function (regionId) {
    var region = null;
    for (var i = 0; i < regions.length; i++) {
      if (regions[i].regionId === regionId) {
        region = regions[i];
        break;
      }
    }
    if (!region) {
      showToast('error', '未找到该区域数据');
      return;
    }
    isEditMode = true;
    document.getElementById('formRegionId').value = region.regionId;
    document.getElementById('formRegionName').value = region.name || '';
    document.getElementById('formRegionCode').value = region.regionCode || '';
    document.getElementById('formParentRegion').value = region.parentId || '';
    var $level = document.getElementById('formLevel');
    $level.value = region.level || 1;
    $level.dataset.userChanged = 'true';
    clearFormErrors();
    document.getElementById('formModalTitle').textContent = '编辑区域 — ' + escapeHtml(region.name);
    document.getElementById('formSubmitBtn').textContent = '更新';
    document.getElementById('formModalOverlay').classList.add('active');
  };

  window.closeFormModal = function () {
    document.getElementById('formModalOverlay').classList.remove('active');
    isEditMode = false;
    clearFormErrors();
    document.getElementById('formLevel').dataset.userChanged = '';
  };

  function clearFormErrors() {
    var $name = document.getElementById('formRegionName');
    if ($name) $name.classList.remove('error');
    var $code = document.getElementById('formRegionCode');
    if ($code) $code.classList.remove('error');
  }

  function validateForm() {
    var valid = true;
    var $name = document.getElementById('formRegionName');
    if (!$name || !$name.value.trim()) {
      if ($name) $name.classList.add('error');
      valid = false;
    } else {
      $name.classList.remove('error');
    }
    var $code = document.getElementById('formRegionCode');
    if (!$code || !$code.value.trim()) {
      if ($code) $code.classList.add('error');
      valid = false;
    } else {
      $code.classList.remove('error');
    }
    return valid;
  }

  window.handleFormSubmit = function () {
    if (!validateForm()) {
      showToast('warning', '请填写区域名称和行政区代码');
      return;
    }
    var formData = {
      name: document.getElementById('formRegionName').value.trim(),
      regionCode: document.getElementById('formRegionCode').value.trim(),
      parentId: document.getElementById('formParentRegion').value
        ? Number(document.getElementById('formParentRegion').value) : null,
      level: Number(document.getElementById('formLevel').value)
    };
    var $btn = document.getElementById('formSubmitBtn');
    if ($btn) { $btn.disabled = true; $btn.textContent = '保存中...'; }

    if (isEditMode) {
      var regionId = Number(document.getElementById('formRegionId').value);
      fetch('/api/regions/' + regionId, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      })
      .then(function (res) { return handleUnauthorized(res).json(); })
      .then(function (data) {
        if ($btn) { $btn.disabled = false; $btn.textContent = '更新'; }
        if (data.code === 200) {
          showToast('success', '区域已更新');
          window.closeFormModal();
          fetchRegions();
        } else {
          showToast('error', data.message || '更新失败');
        }
      })
      .catch(function (err) {
        if ($btn) { $btn.disabled = false; $btn.textContent = '更新'; }
        if (err.message !== 'UNAUTHORIZED') showToast('error', '网络错误');
      });
    } else {
      fetch('/api/regions', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      })
      .then(function (res) { return handleUnauthorized(res).json(); })
      .then(function (data) {
        if ($btn) { $btn.disabled = false; $btn.textContent = '保存'; }
        if (data.code === 200) {
          showToast('success', '区域已创建');
          window.closeFormModal();
          fetchRegions();
        } else {
          showToast('error', data.message || '创建失败');
        }
      })
      .catch(function (err) {
        if ($btn) { $btn.disabled = false; $btn.textContent = '保存'; }
        if (err.message !== 'UNAUTHORIZED') showToast('error', '网络错误');
      });
    }
  };

  window.openDeleteModal = function (regionId) {
    for (var i = 0; i < regions.length; i++) {
      if (regions[i].regionId === regionId) {
        deleteTarget = regions[i];
        break;
      }
    }
    if (!deleteTarget) {
      showToast('error', '未找到该区域');
      return;
    }
    document.getElementById('deleteRegionName').textContent = deleteTarget.name;
    document.getElementById('deleteModalOverlay').classList.add('active');
  };

  window.closeDeleteModal = function () {
    document.getElementById('deleteModalOverlay').classList.remove('active');
    deleteTarget = null;
  };

  window.confirmDelete = function () {
    if (!deleteTarget) return;
    var regionId = deleteTarget.regionId;
    var $btn = document.getElementById('deleteConfirmBtn');
    if ($btn) { $btn.disabled = true; $btn.textContent = '删除中...'; }

    fetch('/api/regions/' + regionId, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    .then(function (res) { return handleUnauthorized(res).json(); })
    .then(function (data) {
      if ($btn) { $btn.disabled = false; $btn.textContent = '确认删除'; }
      if (data.code === 200) {
        showToast('success', '区域已删除');
        window.closeDeleteModal();
        fetchRegions();
      } else {
        showToast('error', data.message || '删除失败');
      }
    })
    .catch(function (err) {
      if ($btn) { $btn.disabled = false; $btn.textContent = '确认删除'; }
      if (err.message !== 'UNAUTHORIZED') showToast('error', '网络错误');
    });
  };

  function init() {
    var token = getToken();
    if (!token) {
      redirectToLogin();
      return;
    }
    var username = localStorage.getItem(USERNAME_KEY) || '用户';
    var $un = document.getElementById('navbarUsername');
    if ($un) $un.textContent = username;

    fetchRegions();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
