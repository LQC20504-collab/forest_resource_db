/**
 * plots.js — 森林资源调查系统 样地管理
 *
 * Responsibilities:
 *   1. Auth guard (check jwt_token → redirect login.html)
 *   2. Fetch GET /api/plots (paginated) and render table
 *   3. CRUD: create (POST), update (PUT), delete (DELETE)
 *   4. Detail view with tree list from GET /api/plots/{id}/trees
 *   5. Region filter dropdown from GET /api/regions
 *   6. Pagination, toast notifications, loading/empty/error states
 *
 * Dependencies:
 *   - plots.html (DOM structure, inline CSS)
 *   - Backend: PlotController, RegionController, TreeService
 */

(function () {
  'use strict';

  /* ==================================================================
   *  Constants
   * ================================================================== */
  var TOKEN_KEY = 'jwt_token';
  var USERNAME_KEY = 'username';
  var PAGE_SIZE = 10;

  /* ==================================================================
   *  State
   * ================================================================== */
  var currentPage = 1;
  var totalPages = 0;
  var totalCount = 0;
  var currentRegionFilter = '';
  var regionMap = {};         /* regionId → regionName */
  var plotDataCache = {};     /* plotId → plot object (for edit/delete lookup) */
  var deleteTargetPlot = null;
  var isEditMode = false;
  var editingPlotId = null;

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

  function fmtNum(val) {
    if (val == null || isNaN(val)) return '—';
    return Number(val).toFixed(2);
  }

  function fmtInt(val) {
    if (val == null || isNaN(val)) return '—';
    return Number(val).toLocaleString('zh-CN');
  }

  /* ==================================================================
   *  Region Fetching
   * ================================================================== */

  function fetchRegions() {
    return fetch('/api/regions', {
      method: 'GET',
      headers: getAuthHeaders()
    })
    .then(function (res) {
      return handleUnauthorized(res).json();
    })
    .then(function (data) {
      if (data.code === 200 && data.data) {
        populateRegionDropdowns(data.data);
        buildRegionMap(data.data);
      } else {
        console.error('Failed to fetch regions:', data.message);
      }
    })
    .catch(function (err) {
      if (err.message !== 'UNAUTHORIZED') {
        console.error('fetchRegions error:', err);
        showToast('error', '加载区域列表失败');
      }
    });
  }

  function buildRegionMap(regions) {
    regionMap = {};
    if (!regions) return;
    regions.forEach(function (region) {
      regionMap[region.regionId] = region.name || region.regionName || ('区域-' + region.regionId);
    });
  }

  function populateRegionDropdowns(regions) {
    /* Main region filter */
    var $regionFilter = document.getElementById('regionFilter');
    if ($regionFilter) {
      $regionFilter.innerHTML = '<option value="">全部区域</option>';
      if (regions && regions.length > 0) {
        regions.forEach(function (region) {
          var option = document.createElement('option');
          option.value = region.regionId;
          option.textContent = region.name || region.regionName || ('区域-' + region.regionId);
          $regionFilter.appendChild(option);
        });
      }
    }

    /* Form region dropdown */
    var $formRegionId = document.getElementById('formRegionId');
    if ($formRegionId) {
      $formRegionId.innerHTML = '<option value="">请选择区域</option>';
      if (regions && regions.length > 0) {
        regions.forEach(function (region) {
          var option = document.createElement('option');
          option.value = region.regionId;
          option.textContent = region.name || region.regionName || ('区域-' + region.regionId);
          $formRegionId.appendChild(option);
        });
      }
    }
  }

  /* ==================================================================
   *  Plot Table Fetching & Rendering
   * ================================================================== */

  function showTableLoading() {
    var tbody = document.getElementById('plotTableBody');
    if (!tbody) return;
    tbody.innerHTML =
      '<tr class="loading-row">' +
        '<td colspan="7" style="text-align:center;padding:32px;">' +
          '<div class="spinner"></div>' +
        '</td>' +
      '</tr>';
    /* Reset pagination info during loading */
    var $paginationInfo = document.getElementById('paginationInfo');
    if ($paginationInfo) {
      $paginationInfo.textContent = '加载中...';
    }
    var $paginationControls = document.getElementById('paginationControls');
    if ($paginationControls) {
      $paginationControls.innerHTML = '';
    }
  }

  function fetchPlots(page) {
    if (page) {
      currentPage = page;
    }

    showTableLoading();

    /* Build URL — client-side filtering: when region filter is active,
       fetch a larger batch and paginate client-side for better UX */
    var url;
    if (currentRegionFilter) {
      url = '/api/plots?page=1&size=1000';
    } else {
      url = '/api/plots?page=' + currentPage + '&size=' + PAGE_SIZE;
    }

    return fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    })
    .then(function (res) {
      return handleUnauthorized(res).json();
    })
    .then(function (data) {
      if (data.code === 200 && data.data) {
        var responseData = data.data;

        /* Extract plots array — handle multiple serialization formats */
        var allPlots;
        if (responseData.list) {
          allPlots = responseData.list;
        } else if (responseData.records) {
          allPlots = responseData.records;
        } else if (Array.isArray(responseData)) {
          allPlots = responseData;
        } else {
          allPlots = [];
        }

        /* Update plot data cache */
        plotDataCache = {};
        allPlots.forEach(function (plot) {
          plotDataCache[plot.plotId] = plot;
        });

        /* Apply client-side region filter */
        var filteredPlots = allPlots;
        if (currentRegionFilter) {
          filteredPlots = allPlots.filter(function (plot) {
            return String(plot.regionId) === String(currentRegionFilter);
          });

          /* Client-side pagination for filtered results */
          totalCount = filteredPlots.length;
          totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
          var startIdx = (currentPage - 1) * PAGE_SIZE;
          var pagePlots = filteredPlots.slice(startIdx, startIdx + PAGE_SIZE);
          renderTable(pagePlots);
          renderPagination();
        } else {
          /* Server-side pagination */
          totalCount = responseData.total || allPlots.length;
          totalPages = responseData.pages || Math.ceil(totalCount / PAGE_SIZE) || 1;
          renderTable(allPlots);
          renderPagination();
        }
      } else {
        renderTable([]);
        renderPagination();
        showToast('error', data.message || '加载样地列表失败');
      }
    })
    .catch(function (err) {
      if (err.message !== 'UNAUTHORIZED') {
        console.error('fetchPlots error:', err);
        renderTable([]);
        renderPagination();
        showToast('error', '网络错误，无法加载样地数据');
      }
    });
  }

  function renderTable(plots) {
    var tbody = document.getElementById('plotTableBody');
    if (!tbody) return;

    /* Empty state */
    if (!plots || plots.length === 0) {
      tbody.innerHTML =
        '<tr class="empty-state">' +
          '<td colspan="7">' +
            '<div class="empty-icon">&#128269;</div>' +
            '<p>暂无数据</p>' +
          '</td>' +
        '</tr>';
      return;
    }

    var html = '';
    plots.forEach(function (plot) {
      var regionName = regionMap[plot.regionId] || ('区域-' + plot.regionId);
      html += '<tr>';
      html += '<td class="plot-code">' + escapeHtml(plot.plotCode) + '</td>';
      html += '<td>' + escapeHtml(regionName) + '</td>';
      html += '<td class="area">' + fmtNum(plot.area) + '</td>';
      html += '<td>' + (plot.surveyYear != null ? plot.surveyYear : '—') + '</td>';
      html += '<td>' + (plot.treeCount != null ? plot.treeCount : '0') + '</td>';
      html += '<td>' + escapeHtml(plot.plotType) + '</td>';
      html += '<td class="actions">';
      html += '<button class="btn btn-ghost btn-sm" onclick="openDetailModal(' + plot.plotId + ')">详情</button>';
      html += '<button class="btn btn-ghost btn-sm" onclick="openEditModal(' + plot.plotId + ')">编辑</button>';
      html += '<button class="btn btn-ghost btn-sm" onclick="openDeleteModal(' + plot.plotId + ')">删除</button>';
      html += '</td>';
      html += '</tr>';
    });

    tbody.innerHTML = html;
  }

  /* ==================================================================
   *  Pagination
   * ================================================================== */

  function renderPagination() {
    var $info = document.getElementById('paginationInfo');
    var $controls = document.getElementById('paginationControls');

    if ($info) {
      if (totalCount === 0) {
        $info.textContent = '共 0 条记录';
      } else {
        var startItem = (currentPage - 1) * PAGE_SIZE + 1;
        var endItem = Math.min(currentPage * PAGE_SIZE, totalCount);
        $info.textContent = '共 ' + totalCount + ' 条记录，显示第 ' + startItem + '-' + endItem + ' 条';
      }
    }

    if (!$controls) return;

    if (totalPages <= 1) {
      $controls.innerHTML = '';
      return;
    }

    var html = '';

    /* Previous button */
    html += '<button class="pagination-btn" onclick="fetchPlots(' + (currentPage - 1) + ')"' +
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
      html += '<button class="pagination-btn" onclick="fetchPlots(1)">1</button>';
      if (startPage > 2) {
        html += '<span class="pagination-ellipsis">...</span>';
      }
    }

    for (var i = startPage; i <= endPage; i++) {
      html += '<button class="pagination-btn' + (i === currentPage ? ' active' : '') +
              '" onclick="fetchPlots(' + i + ')">' + i + '</button>';
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        html += '<span class="pagination-ellipsis">...</span>';
      }
      html += '<button class="pagination-btn" onclick="fetchPlots(' + totalPages + ')">' + totalPages + '</button>';
    }

    /* Next button */
    html += '<button class="pagination-btn" onclick="fetchPlots(' + (currentPage + 1) + ')"' +
            (currentPage >= totalPages ? ' disabled' : '') + '>&gt;</button>';

    $controls.innerHTML = html;
  }

  /* ==================================================================
   *  Region Filter
   * ================================================================== */

  function onRegionFilterChange() {
    var $filter = document.getElementById('regionFilter');
    currentRegionFilter = $filter ? $filter.value : '';
    currentPage = 1;
    fetchPlots(1);
  }

  /* ==================================================================
   *  Form Modal (Create / Edit)
   * ================================================================== */

  function openCreateModal() {
    isEditMode = false;
    editingPlotId = null;

    /* Reset form */
    var form = document.getElementById('plotForm');
    if (form) {
      form.reset();
    }
    var $formPlotId = document.getElementById('formPlotId');
    if ($formPlotId) {
      $formPlotId.value = '';
    }

    /* Clear validation errors */
    clearFormErrors();

    /* Update modal title */
    var $title = document.getElementById('formModalTitle');
    if ($title) {
      $title.textContent = '新建样地';
    }
    var $submitBtn = document.getElementById('formSubmitBtn');
    if ($submitBtn) {
      $submitBtn.textContent = '保存';
    }

    /* Show modal */
    var overlay = document.getElementById('formModalOverlay');
    if (overlay) {
      overlay.classList.add('active');
    }
  }

  function openEditModal(plotId) {
    var plot = plotDataCache[plotId];
    if (!plot) {
      showToast('error', '未找到该样地数据');
      return;
    }

    isEditMode = true;
    editingPlotId = plot.plotId;

    /* Fill form fields */
    var $formPlotId = document.getElementById('formPlotId');
    if ($formPlotId) { $formPlotId.value = plot.plotId; }

    var $formPlotCode = document.getElementById('formPlotCode');
    if ($formPlotCode) { $formPlotCode.value = plot.plotCode || ''; }

    var $formRegionId = document.getElementById('formRegionId');
    if ($formRegionId) { $formRegionId.value = plot.regionId || ''; }

    var $formLatitude = document.getElementById('formLatitude');
    if ($formLatitude) { $formLatitude.value = plot.latitude != null ? plot.latitude : ''; }

    var $formLongitude = document.getElementById('formLongitude');
    if ($formLongitude) { $formLongitude.value = plot.longitude != null ? plot.longitude : ''; }

    var $formElevation = document.getElementById('formElevation');
    if ($formElevation) { $formElevation.value = plot.elevation != null ? plot.elevation : ''; }

    var $formArea = document.getElementById('formArea');
    if ($formArea) { $formArea.value = plot.area != null ? plot.area : ''; }

    var $formSurveyYear = document.getElementById('formSurveyYear');
    if ($formSurveyYear) { $formSurveyYear.value = plot.surveyYear != null ? plot.surveyYear : ''; }

    var $formPlotType = document.getElementById('formPlotType');
    if ($formPlotType) { $formPlotType.value = plot.plotType || ''; }

    var $formDescription = document.getElementById('formDescription');
    if ($formDescription) { $formDescription.value = plot.description || ''; }

    /* Clear validation errors */
    clearFormErrors();

    /* Update modal title */
    var $title = document.getElementById('formModalTitle');
    if ($title) {
      $title.textContent = '编辑样地 — ' + escapeHtml(plot.plotCode);
    }
    var $submitBtn = document.getElementById('formSubmitBtn');
    if ($submitBtn) {
      $submitBtn.textContent = '更新';
    }

    /* Show modal */
    var overlay = document.getElementById('formModalOverlay');
    if (overlay) {
      overlay.classList.add('active');
    }
  }

  function closeFormModal() {
    var overlay = document.getElementById('formModalOverlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
    isEditMode = false;
    editingPlotId = null;
    clearFormErrors();
  }

  function clearFormErrors() {
    var fields = ['formPlotCode', 'formRegionId', 'formArea', 'formSurveyYear', 'formPlotType'];
    fields.forEach(function (fieldId) {
      var el = document.getElementById(fieldId);
      if (el) {
        el.classList.remove('error');
      }
    });
  }

  function markFieldError(fieldId) {
    var el = document.getElementById(fieldId);
    if (el) {
      el.classList.add('error');
    }
  }

  function validateForm() {
    var valid = true;

    var $plotCode = document.getElementById('formPlotCode');
    if ($plotCode && !$plotCode.value.trim()) {
      markFieldError('formPlotCode');
      valid = false;
    }

    var $regionId = document.getElementById('formRegionId');
    if ($regionId && !$regionId.value) {
      markFieldError('formRegionId');
      valid = false;
    }

    var $area = document.getElementById('formArea');
    if ($area && (!$area.value || isNaN($area.value) || Number($area.value) <= 0)) {
      markFieldError('formArea');
      valid = false;
    }

    var $surveyYear = document.getElementById('formSurveyYear');
    if ($surveyYear && (!$surveyYear.value || isNaN($surveyYear.value))) {
      markFieldError('formSurveyYear');
      valid = false;
    }

    var $plotType = document.getElementById('formPlotType');
    if ($plotType && !$plotType.value) {
      markFieldError('formPlotType');
      valid = false;
    }

    return valid;
  }

  function gatherFormData() {
    return {
      plotCode: document.getElementById('formPlotCode') ? document.getElementById('formPlotCode').value.trim() : '',
      regionId: document.getElementById('formRegionId') ? Number(document.getElementById('formRegionId').value) : null,
      latitude: document.getElementById('formLatitude') && document.getElementById('formLatitude').value ? Number(document.getElementById('formLatitude').value) : null,
      longitude: document.getElementById('formLongitude') && document.getElementById('formLongitude').value ? Number(document.getElementById('formLongitude').value) : null,
      elevation: document.getElementById('formElevation') && document.getElementById('formElevation').value ? Number(document.getElementById('formElevation').value) : null,
      area: document.getElementById('formArea') && document.getElementById('formArea').value ? Number(document.getElementById('formArea').value) : null,
      surveyYear: document.getElementById('formSurveyYear') && document.getElementById('formSurveyYear').value ? Number(document.getElementById('formSurveyYear').value) : null,
      plotType: document.getElementById('formPlotType') ? document.getElementById('formPlotType').value : '',
      description: document.getElementById('formDescription') ? document.getElementById('formDescription').value.trim() : ''
    };
  }

  function handleFormSubmit(event) {
    if (event && event.preventDefault) {
      event.preventDefault();
    }

    /* Validate */
    if (!validateForm()) {
      showToast('warning', '请填写所有必填字段');
      return;
    }

    var formData = gatherFormData();

    /* Set submit button to loading state */
    var $submitBtn = document.getElementById('formSubmitBtn');
    if ($submitBtn) {
      $submitBtn.disabled = true;
      $submitBtn.textContent = '保存中...';
    }

    if (isEditMode && editingPlotId) {
      submitUpdate(editingPlotId, formData);
    } else {
      submitCreate(formData);
    }
  }

  function submitCreate(formData) {
    fetch('/api/plots', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(formData)
    })
    .then(function (res) {
      return handleUnauthorized(res).json();
    })
    .then(function (data) {
      resetSubmitButton();
      if (data.code === 200) {
        showToast('success', '样地创建成功');
        closeFormModal();
        fetchPlots(currentPage);
      } else {
        showToast('error', data.message || '创建失败');
      }
    })
    .catch(function (err) {
      resetSubmitButton();
      if (err.message !== 'UNAUTHORIZED') {
        console.error('submitCreate error:', err);
        showToast('error', '网络错误，创建失败');
      }
    });
  }

  function submitUpdate(plotId, formData) {
    fetch('/api/plots/' + plotId, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(formData)
    })
    .then(function (res) {
      return handleUnauthorized(res).json();
    })
    .then(function (data) {
      resetSubmitButton();
      if (data.code === 200) {
        showToast('success', '样地更新成功');
        closeFormModal();
        /* Update local cache */
        if (data.data) {
          plotDataCache[plotId] = data.data;
        }
        fetchPlots(currentPage);
      } else {
        showToast('error', data.message || '更新失败');
      }
    })
    .catch(function (err) {
      resetSubmitButton();
      if (err.message !== 'UNAUTHORIZED') {
        console.error('submitUpdate error:', err);
        showToast('error', '网络错误，更新失败');
      }
    });
  }

  function resetSubmitButton() {
    var $submitBtn = document.getElementById('formSubmitBtn');
    if ($submitBtn) {
      $submitBtn.disabled = false;
      $submitBtn.textContent = isEditMode ? '更新' : '保存';
    }
  }

  /* ==================================================================
   *  Detail Modal
   * ================================================================== */

  function openDetailModal(plotId) {
    /* Show modal with loading spinner */
    var overlay = document.getElementById('detailModalOverlay');
    if (overlay) {
      overlay.classList.add('active');
    }

    var body = document.getElementById('detailModalBody');
    if (body) {
      body.innerHTML = '<div style="text-align:center;padding:32px;"><div class="spinner"></div></div>';
    }

    var title = document.getElementById('detailModalTitle');
    if (title) {
      title.textContent = '样地详情 — 加载中...';
    }

    /* Fetch plot detail and trees in parallel */
    Promise.all([
      fetch('/api/plots/' + plotId, {
        method: 'GET',
        headers: getAuthHeaders()
      }).then(function (res) { return handleUnauthorized(res).json(); }),
      fetch('/api/plots/' + plotId + '/trees', {
        method: 'GET',
        headers: getAuthHeaders()
      }).then(function (res) { return handleUnauthorized(res).json(); }),
      fetch('/api/volumes/plot/' + plotId, {
        method: 'GET',
        headers: getAuthHeaders()
      }).then(function (res) { return handleUnauthorized(res).json(); })
    ])
    .then(function (results) {
      var plotResult = results[0];
      var treesResult = results[1];
      var volumesResult = results[2];

      if (plotResult.code !== 200 || !plotResult.data) {
        showToast('error', plotResult.message || '加载样地详情失败');
        if (body) {
          body.innerHTML = '<div style="text-align:center;padding:32px;color:var(--color-text-muted);">加载失败</div>';
        }
        return;
      }

      var plot = plotResult.data;
      var trees = (treesResult.code === 200 && treesResult.data) ? treesResult.data : [];

      /* Build volume map: treeId → { measuredVolume, measureDate } */
      var volumeMap = {};
      if (volumesResult.code === 200 && volumesResult.data) {
        volumesResult.data.forEach(function (v) {
          volumeMap[v.treeId] = v;
        });
      }

      /* Update title */
      if (title) {
        title.textContent = '样地详情 — ' + escapeHtml(plot.plotCode);
      }

      /* Render detail content */
      renderDetail(plot, trees, volumeMap);
    })
    .catch(function (err) {
      if (err.message !== 'UNAUTHORIZED') {
        console.error('openDetailModal error:', err);
        showToast('error', '网络错误，加载详情失败');
        if (body) {
          body.innerHTML = '<div style="text-align:center;padding:32px;color:var(--color-text-muted);">加载失败</div>';
        }
      }
    });
  }

  function closeDetailModal() {
    var overlay = document.getElementById('detailModalOverlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }

  function renderDetail(plot, trees, volumeMap) {
    var body = document.getElementById('detailModalBody');
    if (!body) return;

    var regionName = regionMap[plot.regionId] || ('区域-' + plot.regionId);

    var html = '';

    /* Plot info grid */
    html += '<div class="detail-grid">';
    html += '<div class="detail-item"><span class="detail-label">样地编号</span><span class="detail-value code">' + escapeHtml(plot.plotCode) + '</span></div>';
    html += '<div class="detail-item"><span class="detail-label">所属区域</span><span class="detail-value">' + escapeHtml(regionName) + '</span></div>';
    html += '<div class="detail-item"><span class="detail-label">纬度</span><span class="detail-value">' + (plot.latitude != null ? fmtNum(plot.latitude) : '—') + '</span></div>';
    html += '<div class="detail-item"><span class="detail-label">经度</span><span class="detail-value">' + (plot.longitude != null ? fmtNum(plot.longitude) : '—') + '</span></div>';
    html += '<div class="detail-item"><span class="detail-label">海拔 (m)</span><span class="detail-value">' + (plot.elevation != null ? fmtNum(plot.elevation) : '—') + '</span></div>';
    html += '<div class="detail-item"><span class="detail-label">面积 (ha)</span><span class="detail-value">' + fmtNum(plot.area) + '</span></div>';
    html += '<div class="detail-item"><span class="detail-label">调查年份</span><span class="detail-value">' + (plot.surveyYear != null ? plot.surveyYear : '—') + '</span></div>';
    html += '<div class="detail-item"><span class="detail-label">样地类型</span><span class="detail-value">' + escapeHtml(plot.plotType) + '</span></div>';
    if (plot.description) {
      html += '<div class="detail-item detail-item--full"><span class="detail-label">描述</span><span class="detail-value">' + escapeHtml(plot.description) + '</span></div>';
    }
    html += '</div>';

    /* Tree list section */
    html += '<div class="detail-section-title" style="display:flex;justify-content:space-between;align-items:center;">';
    html += '<span>树木列表 (' + trees.length + ' 棵)</span>';
    html += '<div style="display:flex;gap:6px;">';
    html += '<button class="btn btn-primary btn-sm" onclick="openTreeCreateModal(' + plot.plotId + ')">+ 添加树木</button>';
    html += '<button class="btn btn-outline btn-sm" onclick="openBatchTreeModal(' + plot.plotId + ')">📋 批量导入</button>';
    html += '</div>';
    html += '</div>';

    if (!trees || trees.length === 0) {
      html += '<p style="text-align:center;padding:24px;color:var(--color-text-muted);">该样地暂无树木数据</p>';
    } else {
      html += '<div style="overflow-x:auto;">';
      html += '<table class="tree-table">';
      html += '<thead><tr>';
      html += '<th>序号</th>';
      html += '<th>树种</th>';
      html += '<th>编号</th>';
      html += '<th>胸径 (cm)</th>';
      html += '<th>树高 (m)</th>';
      html += '<th>树龄 (年)</th>';
      html += '<th>健康状况</th>';
      html += '<th>实测蓄积量 (m³)</th>';
      html += '<th>测量日期</th>';
      html += '<th>操作</th>';
      html += '</tr></thead>';
      html += '<tbody>';

      trees.forEach(function (tree, idx) {
        var treeNum = escapeHtml(tree.treeNumber || '');
        html += '<tr>';
        html += '<td>' + (idx + 1) + '</td>';
        html += '<td>' + escapeHtml(tree.speciesName || ('树种-' + tree.speciesId)) + '</td>';
        html += '<td>' + escapeHtml(tree.treeNumber) + '</td>';
        html += '<td>' + fmtNum(tree.dbh) + '</td>';
        html += '<td>' + fmtNum(tree.height) + '</td>';
        html += '<td>' + (tree.age != null ? tree.age : '—') + '</td>';
        html += '<td>' + escapeHtml(tree.healthStatus) + '</td>';
        var vol = volumeMap ? volumeMap[tree.treeId] : null;
        html += '<td>' + (vol && vol.measuredVolume != null ? fmtNum(vol.measuredVolume) : '—') + '</td>';
        html += '<td>' + (vol && vol.measureDate ? escapeHtml(vol.measureDate) : '—') + '</td>';
        html += '<td>';
        html += '<button class="btn-xs btn-edit" onclick="openTreeEditModal(' + tree.treeId + ')">编辑</button>';
        html += '<button class="btn-xs btn-del" onclick="confirmDeleteTree(' + tree.treeId + ', \'' + treeNum.replace(/'/g, '') + '\', ' + plot.plotId + ')" style="margin-left:4px;">删除</button>';
        html += '</td>';
        html += '</tr>';
      });

      html += '</tbody></table></div>';
    }

    body.innerHTML = html;
  }

  /* ==================================================================
   *  Delete Modal
   * ================================================================== */

  function openDeleteModal(plotId) {
    var plot = plotDataCache[plotId];
    if (!plot) {
      /* Try to find in detail context — if not cached, show error */
      showToast('error', '未找到该样地数据');
      return;
    }

    deleteTargetPlot = plot;

    var $code = document.getElementById('deletePlotCode');
    if ($code) {
      $code.textContent = plot.plotCode;
    }

    var overlay = document.getElementById('deleteModalOverlay');
    if (overlay) {
      overlay.classList.add('active');
    }
  }

  function closeDeleteModal() {
    var overlay = document.getElementById('deleteModalOverlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
    deleteTargetPlot = null;
  }

  function confirmDelete() {
    if (!deleteTargetPlot) return;

    var plotId = deleteTargetPlot.plotId;
    var $btn = document.getElementById('deleteConfirmBtn');
    if ($btn) {
      $btn.disabled = true;
      $btn.textContent = '删除中...';
    }

    fetch('/api/plots/' + plotId, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    .then(function (res) {
      return handleUnauthorized(res).json();
    })
    .then(function (data) {
      if ($btn) {
        $btn.disabled = false;
        $btn.textContent = '确认删除';
      }
      if (data.code === 200) {
        showToast('success', '样地已删除');
        closeDeleteModal();
        /* Remove from cache */
        delete plotDataCache[plotId];
        /* Reload current page — if last item on page, go to previous page */
        if (totalCount > 1 && (totalCount - 1) <= (currentPage - 1) * PAGE_SIZE) {
          currentPage = Math.max(1, currentPage - 1);
        }
        fetchPlots(currentPage);
      } else {
        showToast('error', data.message || '删除失败');
      }
    })
    .catch(function (err) {
      if ($btn) {
        $btn.disabled = false;
        $btn.textContent = '确认删除';
      }
      if (err.message !== 'UNAUTHORIZED') {
        console.error('confirmDelete error:', err);
        showToast('error', '网络错误，删除失败');
      }
    });
  }

  /* ==================================================================
   *  Initialization
   * ================================================================== */

  function initPlots() {
    /* 1. Auth guard */
    var token = getToken();
    if (!token) {
      redirectToLogin();
      return;
    }

    /* 2. Display username in navbar (if element exists) */
    var username = localStorage.getItem(USERNAME_KEY) || '用户';
    var $usernameDisplay = document.getElementById('navbarUsername');
    if ($usernameDisplay) {
      $usernameDisplay.textContent = username;
    }

    /* 3. Fetch regions, then fetch plots */
    fetchRegions()
      .then(function () {
        return fetchPlots(1);
      })
      .catch(function (err) {
        if (err.message !== 'UNAUTHORIZED') {
          console.error('initPlots error:', err);
        }
      });
  }

  /* ==================================================================
   *  Bootstrap
   * ================================================================== */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlots);
  } else {
    initPlots();
  }

  /* ==================================================================
   *  Tree Edit / Delete
   * ================================================================== */

  function openTreeCreateModal(plotId) {
    /* Reset form */
    document.getElementById('treeEditId').value = '';
    document.getElementById('treeEditPlotId').value = plotId;
    document.getElementById('treeEditSpecies').value = '';
    document.getElementById('treeEditNumber').value = '';
    document.getElementById('treeEditDbh').value = '';
    document.getElementById('treeEditHeight').value = '';
    document.getElementById('treeEditAge').value = '';
    document.getElementById('treeEditHealth').value = '';
    document.getElementById('treeEditVolume').value = '';
    document.getElementById('treeEditMeasureDate').value = '';
    /* Focus on species field for quick typing */
    var speciesInput = document.getElementById('treeEditSpecies');
    if (speciesInput) speciesInput.focus();
    /* Update title */
    var titleEl = document.getElementById('treeEditModalTitle');
    if (titleEl) titleEl.textContent = '新建树木';
    document.getElementById('treeEditModalOverlay').classList.add('active');
  }

  function openTreeEditModal(treeId) {
    fetch('/api/trees/' + treeId, {
      headers: getAuthHeaders()
    })
    .then(function (res) { return handleUnauthorized(res).json(); })
    .then(function (data) {
      if (data.code !== 200 || !data.data) {
        showToast('error', data.message || '获取树木数据失败');
        return;
      }
      var t = data.data;
      document.getElementById('treeEditId').value = t.treeId;
      document.getElementById('treeEditPlotId').value = t.plotId || '';
      document.getElementById('treeEditSpecies').value = t.speciesName || '';
      document.getElementById('treeEditNumber').value = t.treeNumber || '';
      document.getElementById('treeEditDbh').value = t.dbh || '';
      document.getElementById('treeEditHeight').value = t.height || '';
      document.getElementById('treeEditAge').value = t.age != null ? t.age : '';
      document.getElementById('treeEditHealth').value = t.healthStatus || '';
      /* Load volume data for this tree */
      fetch('/api/volumes/tree/' + treeId, {
        headers: getAuthHeaders()
      })
      .then(function (r) { return r.json(); })
      .then(function (vd) {
        if (vd.code === 200 && vd.data) {
          document.getElementById('treeEditVolume').value = vd.data.measuredVolume || '';
          document.getElementById('treeEditMeasureDate').value = vd.data.measureDate || '';
        }
      })
      .catch(function () { /* volume optional, ignore */ });
      /* Update title for edit mode */
      var titleEl = document.getElementById('treeEditModalTitle');
      if (titleEl) titleEl.textContent = '编辑树木';
      document.getElementById('treeEditModalOverlay').classList.add('active');
    })
    .catch(function (err) {
      if (err.message !== 'UNAUTHORIZED') {
        console.error('openTreeEditModal error:', err);
        showToast('error', '网络错误');
      }
    });
  }

  function closeTreeEditModal() {
    document.getElementById('treeEditModalOverlay').classList.remove('active');
  }

  function treeEditFormSubmit(event) {
    if (event) event.preventDefault();
    var treeId = document.getElementById('treeEditId').value;
    var isCreate = !treeId;
    var plotId = document.getElementById('treeEditPlotId').value;
    if (!plotId) {
      showToast('error', '缺少样地信息');
      return;
    }
    var speciesName = document.getElementById('treeEditSpecies').value.trim();
    if (!speciesName) {
      showToast('error', '请填写树种名称');
      return;
    }
    var data = {
      speciesName: speciesName,
      treeNumber: document.getElementById('treeEditNumber').value.trim() || null,
      dbh: parseFloat(document.getElementById('treeEditDbh').value) || null,
      height: parseFloat(document.getElementById('treeEditHeight').value) || null,
      age: parseInt(document.getElementById('treeEditAge').value, 10) || null,
      healthStatus: document.getElementById('treeEditHealth').value.trim() || null
    };
    var volumeValue = parseFloat(document.getElementById('treeEditVolume').value);
    var hasVolume = !isNaN(volumeValue) && volumeValue > 0;
    data.plotId = parseInt(plotId, 10);
    if (!data.dbh || !data.height) {
      showToast('error', '胸径和树高为必填项');
      return;
    }
    var $btn = document.getElementById('treeEditSubmitBtn');
    if ($btn) { $btn.disabled = true; $btn.textContent = '保存中...'; }

    var url = isCreate ? '/api/trees' : '/api/trees/' + treeId;
    var method = isCreate ? 'POST' : 'PUT';
    if (isCreate) {
      data.plotId = parseInt(plotId, 10);
    }

    fetch(url, {
      method: method,
      headers: getAuthHeaders('application/json'),
      body: JSON.stringify(data)
    })
    .then(function (res) { return handleUnauthorized(res).json(); })
    .then(function (result) {
      if ($btn) { $btn.disabled = false; $btn.textContent = '保存'; }
      if (result.code === 200) {
        /* Save volume if provided */
        var savedTreeId = result.data ? result.data.treeId : (isCreate ? null : treeId);
        if (hasVolume && savedTreeId) {
          var volUrl = '/api/volumes/tree/' + savedTreeId;
          var volData = {
            measuredVolume: volumeValue,
            measureDate: document.getElementById('treeEditMeasureDate').value || new Date().toISOString().split('T')[0]
          };
          fetch(volUrl, {
            method: 'PUT',
            headers: getAuthHeaders('application/json'),
            body: JSON.stringify(volData)
          }).catch(function () { /* volume save failure is non-critical */ });
        }
        showToast('success', isCreate ? '树木已添加' : '树木已更新');
        closeTreeEditModal();
        /* Refresh the detail modal if it's open */
        if (plotId) {
          openDetailModal(parseInt(plotId, 10));
        }
      } else {
        showToast('error', result.message || (isCreate ? '添加失败' : '更新失败'));
      }
    })
    .catch(function (err) {
      if ($btn) { $btn.disabled = false; $btn.textContent = '保存'; }
      if (err.message !== 'UNAUTHORIZED') {
        console.error('treeEditFormSubmit error:', err);
        showToast('error', '网络错误');
      }
    });
  }

  function confirmDeleteTree(treeId, treeNumber, plotId) {
    if (!confirm('确定要删除树木 ' + (treeNumber || '#' + treeId) + ' 吗？此操作不可恢复。')) return;
    fetch('/api/trees/' + treeId, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    .then(function (res) { return handleUnauthorized(res).json(); })
    .then(function (result) {
      if (result.code === 200) {
        showToast('success', '树木已删除');
        /* Refresh detail modal if we have plotId */
        if (plotId) {
          openDetailModal(plotId);
        }
      } else {
        showToast('error', result.message || '删除失败');
      }
    })
    .catch(function (err) {
      if (err.message !== 'UNAUTHORIZED') {
        console.error('confirmDeleteTree error:', err);
        showToast('error', '网络错误');
      }
    });
  }

  /* ==================================================================
   *  Batch Plot Import
   * ================================================================== */

  function openBatchPlotModal() {
    document.getElementById('batchPlotInput').value =
      '样地编号, 区域名称, 面积, 调查年份, 样地类型, 纬度, 经度, 海拔, 描述\n' +
      'PLOT-A1, 西湖区, 0.06, 2025, 固定样地, 30.25, 120.12, 350\n' +
      'PLOT-A2, 余杭区, 0.08, 2025, 临时样地, 30.35, 120.08';
    document.getElementById('batchPlotError').textContent = '';
    document.getElementById('batchPlotError').style.display = 'none';
    document.getElementById('batchPlotModalOverlay').classList.add('active');
  }

  function closeBatchPlotModal() {
    document.getElementById('batchPlotModalOverlay').classList.remove('active');
  }

  function batchPlotSubmit() {
    var raw = document.getElementById('batchPlotInput').value.trim();
    if (!raw) { showToast('error', '请粘贴样地数据'); return; }

    var lines = raw.split('\n').filter(function (l) { return l.trim(); });
    if (lines.length < 2) { showToast('error', '至少需要标题行 + 一行数据'); return; }

    var plots = [];
    var errors = [];
    for (var i = 1; i < lines.length; i++) {
      var parts = lines[i].split(',').map(function (s) { return s.trim(); });
      if (parts.length < 4) {
        errors.push('第' + (i + 1) + '行: 数据不足（至少需要样地编号,区域名称,面积,调查年份,样地类型）');
        continue;
      }
      var p = {
        plotCode: parts[0] || null,
        regionName: parts[1] || null,
        area: parseFloat(parts[2]) || null,
        surveyYear: parseInt(parts[3], 10) || null,
        plotType: parts[4] || null,
        latitude: parseFloat(parts[5]) || null,
        longitude: parseFloat(parts[6]) || null,
        elevation: parseFloat(parts[7]) || null,
        description: parts[8] || null
      };
      if (!p.plotCode || !p.regionName || !p.area || !p.surveyYear || !p.plotType) {
        errors.push('第' + (i + 1) + '行: 样地编号/区域/面积/年份/类型为必填');
        continue;
      }
      plots.push(p);
    }

    if (plots.length === 0) {
      document.getElementById('batchPlotError').textContent = '没有有效数据:\n' + errors.join('\n');
      document.getElementById('batchPlotError').style.display = 'block';
      return;
    }

    var $btn = document.getElementById('batchPlotSubmitBtn');
    if ($btn) { $btn.disabled = true; $btn.textContent = '导入 ' + plots.length + ' 个...'; }

    fetch('/api/plots/batch', {
      method: 'POST',
      headers: getAuthHeaders('application/json'),
      body: JSON.stringify(plots)
    })
    .then(function (res) { return handleUnauthorized(res).json(); })
    .then(function (result) {
      if ($btn) { $btn.disabled = false; $btn.textContent = '确认导入'; }
      if (result.code === 200) {
        var count = (result.data || []).length;
        showToast('success', '成功导入 ' + count + ' 个样地');
        closeBatchPlotModal();
        fetchPlots(currentPage);
      } else {
        showToast('error', result.message || '批量导入失败');
      }
    })
    .catch(function (err) {
      if ($btn) { $btn.disabled = false; $btn.textContent = '确认导入'; }
      if (err.message !== 'UNAUTHORIZED') {
        console.error('batchPlotSubmit error:', err);
        showToast('error', '网络错误');
      }
    });
  }

  /* ==================================================================
   *  Batch Tree Import
   * ================================================================== */

  function openBatchTreeModal(plotId) {
    document.getElementById('batchTreePlotId').value = plotId;
    document.getElementById('batchTreeInput').value =
      '树种, 胸径, 树高, 树龄, 编号, 健康状况\n' +
      '马尾松, 15.2, 12.5, 30, T001, 良好\n' +
      '杉木, 18.5, 14.2, 25, T002, 健康';
    document.getElementById('batchTreeError').textContent = '';
    document.getElementById('batchTreeError').style.display = 'none';
    document.getElementById('batchTreeModalOverlay').classList.add('active');
  }

  function closeBatchTreeModal() {
    document.getElementById('batchTreeModalOverlay').classList.remove('active');
  }

  function batchTreeSubmit() {
    var plotId = document.getElementById('batchTreePlotId').value;
    if (!plotId) { showToast('error', '缺少样地信息'); return; }
    var raw = document.getElementById('batchTreeInput').value.trim();
    if (!raw) { showToast('error', '请粘贴树木数据'); return; }

    var lines = raw.split('\n').filter(function (l) { return l.trim(); });
    if (lines.length < 2) { showToast('error', '至少需要标题行 + 一行数据'); return; }

    var trees = [];
    var errors = [];
    for (var i = 1; i < lines.length; i++) {
      var parts = lines[i].split(',').map(function (s) { return s.trim(); });
      if (parts.length < 2) {
        errors.push('第' + (i + 1) + '行: 数据不足');
        continue;
      }
      var t = {
        plotId: parseInt(plotId, 10),
        speciesName: parts[0] || null,
        dbh: parseFloat(parts[1]) || null,
        height: parseFloat(parts[2]) || null,
        age: parseInt(parts[3], 10) || null,
        treeNumber: parts[4] || null,
        healthStatus: parts[5] || null
      };
      if (!t.speciesName || !t.dbh || !t.height) {
        errors.push('第' + (i + 1) + '行: 树种/胸径/树高为必填');
        continue;
      }
      trees.push(t);
    }

    if (trees.length === 0) {
      document.getElementById('batchTreeError').textContent =
        '没有有效数据:\n' + errors.join('\n');
      document.getElementById('batchTreeError').style.display = 'block';
      return;
    }

    var $btn = document.getElementById('batchTreeSubmitBtn');
    if ($btn) { $btn.disabled = true; $btn.textContent = '导入 ' + trees.length + ' 棵...'; }

    fetch('/api/trees/batch', {
      method: 'POST',
      headers: getAuthHeaders('application/json'),
      body: JSON.stringify(trees)
    })
    .then(function (res) { return handleUnauthorized(res).json(); })
    .then(function (result) {
      if ($btn) { $btn.disabled = false; $btn.textContent = '确认导入'; }
      if (result.code === 200) {
        var count = (result.data || []).length;
        showToast('success', '成功导入 ' + count + ' 棵树木');
        closeBatchTreeModal();
        /* Refresh detail modal */
        openDetailModal(parseInt(plotId, 10));
      } else {
        showToast('error', result.message || '批量导入失败');
      }
    })
    .catch(function (err) {
      if ($btn) { $btn.disabled = false; $btn.textContent = '确认导入'; }
      if (err.message !== 'UNAUTHORIZED') {
        console.error('batchTreeSubmit error:', err);
        showToast('error', '网络错误');
      }
    });
  }

  /* Expose functions to global scope for inline HTML event handlers */
  window.openCreateModal = openCreateModal;
  window.openEditModal = openEditModal;
  window.openDeleteModal = openDeleteModal;
  window.openDetailModal = openDetailModal;
  window.closeFormModal = closeFormModal;
  window.closeDetailModal = closeDetailModal;
  window.closeDeleteModal = closeDeleteModal;
  window.confirmDelete = confirmDelete;
  window.handleFormSubmit = handleFormSubmit;
  window.onRegionFilterChange = onRegionFilterChange;
  window.fetchPlots = fetchPlots;
  window.handleLogout = handleLogout;
  window.openTreeEditModal = openTreeEditModal;
  window.openTreeCreateModal = openTreeCreateModal;
  window.closeTreeEditModal = closeTreeEditModal;
  window.treeEditFormSubmit = treeEditFormSubmit;
  window.confirmDeleteTree = confirmDeleteTree;
  window.openBatchTreeModal = openBatchTreeModal;
  window.closeBatchTreeModal = closeBatchTreeModal;
  window.batchTreeSubmit = batchTreeSubmit;
  window.openBatchPlotModal = openBatchPlotModal;
  window.closeBatchPlotModal = closeBatchPlotModal;
  window.batchPlotSubmit = batchPlotSubmit;

})();
