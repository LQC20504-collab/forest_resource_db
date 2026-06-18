/**
 * admin-species.js — 森林资源调查系统 树种管理
 *
 * Responsibilities:
 *   1. Auth guard (check jwt_token -> redirect login.html)
 *   2. Fetch GET /api/species and render table
 *   3. CRUD: create (POST), update (PUT), delete (DELETE)
 *   4. Toast notifications, loading/empty/error states
 *
 * Dependencies:
 *   - admin-species.html (DOM structure, inline CSS)
 *   - Backend: SpeciesController
 */

(function () {
  'use strict';

  var TOKEN_KEY = 'jwt_token';
  var USERNAME_KEY = 'username';

  var species = [];
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

  function fetchSpecies() {
    fetch('/api/species', {
      method: 'GET',
      headers: getAuthHeaders()
    })
    .then(function (res) { return handleUnauthorized(res).json(); })
    .then(function (data) {
      if (data.code === 200 && data.data) {
        species = Array.isArray(data.data) ? data.data : [];
        renderTable();
      } else {
        showToast('error', data.message || '加载树种列表失败');
        renderEmpty();
      }
    })
    .catch(function (err) {
      if (err.message !== 'UNAUTHORIZED') {
        showToast('error', '网络错误，无法加载树种数据');
        renderEmpty();
      }
    });
  }

  function renderTable() {
    var tbody = document.getElementById('speciesTableBody');
    if (!tbody) return;

    if (!species || species.length === 0) {
      renderEmpty();
      return;
    }

    var html = '';
    species.forEach(function (s) {
      html += '<tr>';
      html += '<td>' + s.speciesId + '</td>';
      html += '<td class="species-name">' + escapeHtml(s.commonName) + '</td>';
      html += '<td class="scientific-name"><em>' + escapeHtml(s.latinName || '—') + '</em></td>';
      html += '<td>' + (s.woodDensity != null ? Number(s.woodDensity).toFixed(4) : '—') + '</td>';
      html += '<td>' + (s.carbonCoefficient != null ? Number(s.carbonCoefficient).toFixed(4) : '—') + '</td>';
      html += '<td class="actions">';
      html += '<button class="btn btn-ghost btn-sm" onclick="window.openEditModal(' + s.speciesId + ')">编辑</button>';
      html += '<button class="btn btn-ghost btn-sm" onclick="window.openDeleteModal(' + s.speciesId + ')">删除</button>';
      html += '</td>';
      html += '</tr>';
    });
    tbody.innerHTML = html;
  }

  function renderEmpty() {
    var tbody = document.getElementById('speciesTableBody');
    if (!tbody) return;
    tbody.innerHTML =
      '<tr class="empty-state">' +
        '<td colspan="6">' +
          '<div class="empty-icon">&#128269;</div>' +
          '<p>暂无数据</p>' +
        '</td>' +
      '</tr>';
  }

  window.openCreateModal = function () {
    isEditMode = false;
    document.getElementById('formSpeciesId').value = '';
    document.getElementById('formCommonName').value = '';
    document.getElementById('formLatinName').value = '';
    document.getElementById('formWoodDensity').value = '';
    document.getElementById('formCarbonCoefficient').value = '';
    clearFormErrors();
    document.getElementById('formModalTitle').textContent = '新建树种';
    document.getElementById('formSubmitBtn').textContent = '保存';
    document.getElementById('formModalOverlay').classList.add('active');
  };

  window.openEditModal = function (speciesId) {
    var s = null;
    for (var i = 0; i < species.length; i++) {
      if (species[i].speciesId === speciesId) {
        s = species[i];
        break;
      }
    }
    if (!s) {
      showToast('error', '未找到该树种数据');
      return;
    }
    isEditMode = true;
    document.getElementById('formSpeciesId').value = s.speciesId;
    document.getElementById('formCommonName').value = s.commonName || '';
    document.getElementById('formLatinName').value = s.latinName || '';
    document.getElementById('formWoodDensity').value = s.woodDensity || '';
    document.getElementById('formCarbonCoefficient').value = s.carbonCoefficient || '';
    clearFormErrors();
    document.getElementById('formModalTitle').textContent = '编辑树种 — ' + escapeHtml(s.commonName);
    document.getElementById('formSubmitBtn').textContent = '更新';
    document.getElementById('formModalOverlay').classList.add('active');
  };

  window.closeFormModal = function () {
    document.getElementById('formModalOverlay').classList.remove('active');
    isEditMode = false;
    clearFormErrors();
  };

  function clearFormErrors() {
    var $name = document.getElementById('formCommonName');
    if ($name) $name.classList.remove('error');
  }

  function validateForm() {
    var valid = true;
    var $name = document.getElementById('formCommonName');
    if (!$name || !$name.value.trim()) {
      if ($name) $name.classList.add('error');
      valid = false;
    } else {
      $name.classList.remove('error');
    }
    return valid;
  }

  window.handleFormSubmit = function () {
    if (!validateForm()) {
      showToast('warning', '请填写通用名');
      return;
    }
    var formData = {
      commonName: document.getElementById('formCommonName').value.trim(),
      latinName: document.getElementById('formLatinName').value.trim() || null,
      woodDensity: document.getElementById('formWoodDensity').value
        ? parseFloat(document.getElementById('formWoodDensity').value) : null,
      carbonCoefficient: document.getElementById('formCarbonCoefficient').value
        ? parseFloat(document.getElementById('formCarbonCoefficient').value) : null
    };
    var $btn = document.getElementById('formSubmitBtn');
    if ($btn) { $btn.disabled = true; $btn.textContent = '保存中...'; }

    if (isEditMode) {
      var speciesId = Number(document.getElementById('formSpeciesId').value);
      fetch('/api/species/' + speciesId, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      })
      .then(function (res) { return handleUnauthorized(res).json(); })
      .then(function (data) {
        if ($btn) { $btn.disabled = false; $btn.textContent = '更新'; }
        if (data.code === 200) {
          showToast('success', '树种已更新');
          window.closeFormModal();
          fetchSpecies();
        } else {
          showToast('error', data.message || '更新失败');
        }
      })
      .catch(function (err) {
        if ($btn) { $btn.disabled = false; $btn.textContent = '更新'; }
        if (err.message !== 'UNAUTHORIZED') showToast('error', '网络错误');
      });
    } else {
      fetch('/api/species', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      })
      .then(function (res) { return handleUnauthorized(res).json(); })
      .then(function (data) {
        if ($btn) { $btn.disabled = false; $btn.textContent = '保存'; }
        if (data.code === 200) {
          showToast('success', '树种已创建');
          window.closeFormModal();
          fetchSpecies();
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

  window.openDeleteModal = function (speciesId) {
    for (var i = 0; i < species.length; i++) {
      if (species[i].speciesId === speciesId) {
        deleteTarget = species[i];
        break;
      }
    }
    if (!deleteTarget) {
      showToast('error', '未找到该树种');
      return;
    }
    document.getElementById('deleteSpeciesName').textContent = deleteTarget.commonName;
    document.getElementById('deleteModalOverlay').classList.add('active');
  };

  window.closeDeleteModal = function () {
    document.getElementById('deleteModalOverlay').classList.remove('active');
    deleteTarget = null;
  };

  window.confirmDelete = function () {
    if (!deleteTarget) return;
    var speciesId = deleteTarget.speciesId;
    var $btn = document.getElementById('deleteConfirmBtn');
    if ($btn) { $btn.disabled = true; $btn.textContent = '删除中...'; }

    fetch('/api/species/' + speciesId, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    .then(function (res) { return handleUnauthorized(res).json(); })
    .then(function (data) {
      if ($btn) { $btn.disabled = false; $btn.textContent = '确认删除'; }
      if (data.code === 200) {
        showToast('success', '树种已删除');
        window.closeDeleteModal();
        fetchSpecies();
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

    fetchSpecies();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
