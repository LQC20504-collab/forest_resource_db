/**
 * map.js — 森林资源调查系统 样地地图
 *
 * Responsibilities:
 *   1. Auth guard (check jwt_token → redirect login.html)
 *   2. Initialize Leaflet map with OSM tiles
 *   3. Fetch ALL plots from GET /api/plots/all (no pagination)
 *   4. Place markers with custom icons at each plot's lat/lng
 *   5. Side panel: region filter + clickable plot list
 *   6. Marker popup: plot info + link to detail page
 *   7. Pan-to-plot on side panel item click
 *
 * Dependencies:
 *   - map.html (DOM structure, Leaflet CSS)
 *   - Leaflet 1.9.x (CDN)
 *   - Backend: PlotController.findAllForMap
 */

(function () {
  'use strict';

  /* ==================================================================
   *  Global error handler — 捕获 JS 错误并显示在页面上
   * ================================================================== */
  window.addEventListener('error', function (e) {
    var $panel = document.getElementById('panelSubtitle');
    if ($panel) {
      $panel.textContent = '⚠ 错误: ' + (e.message || '未知错误');
      $panel.style.color = '#e74c3c';
    }
    console.error('[map.js]', e.message || e);
  });

  /* ==================================================================
   *  Constants
   * ================================================================== */
  var TOKEN_KEY = 'jwt_token';
  var USERNAME_KEY = 'username';

  /* ==================================================================
   *  State
   * ================================================================== */
  var map = null;
  var markers = [];           /* { marker, plot } pairs */
  var allPlots = [];
  var regionMap = {};         /* regionId → regionName */

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
   *  Map Initialization
   * ================================================================== */

  function initMap() {
    /* 检查 Leaflet 是否加载成功 */
    if (typeof L === 'undefined') {
      var $panel = document.getElementById('panelSubtitle');
      if ($panel) {
        $panel.textContent = '⚠ Leaflet 地图库加载失败，请刷新页面';
        $panel.style.color = '#e74c3c';
      }
      return;
    }

    /* Center on Zhejiang roughly (all plots are in Zhejiang) */
    map = L.map('map', {
      center: [29.8, 120.5],
      zoom: 9,
      zoomControl: true
    });

    /* 去掉 Leaflet 自带版权文字 */
    map.attributionControl.setPrefix(false);

    /* ========== 天地图图层定义 ========== */
    var key = '760b0466fad9228646cdc99e8ec836c5';
    var tdAttr = '&copy; <a href="https://www.tianditu.gov.cn/" target="_blank">天地图</a>';
    var tdSub = ['0', '1', '2', '3', '4', '5', '6', '7'];
    var tdOpts = { subdomains: tdSub, maxZoom: 18, attribution: tdAttr };

    /** 构造 WMTS 瓦片 URL */
    function tdUrl(layer) {
      return 'https://t{s}.tianditu.gov.cn/' + layer + '_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=' + layer + '&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=' + key;
    }

    /* 矢量底图（默认） */
    var vecBase = L.tileLayer(tdUrl('vec'), tdOpts);
    var vecLabel = L.tileLayer(tdUrl('cva'), tdOpts);
    var vectorLayer = L.layerGroup([vecBase, vecLabel]);

    /* 影像底图 */
    var imgBase = L.tileLayer(tdUrl('img'), tdOpts);
    var imgLabel = L.tileLayer(tdUrl('cia'), tdOpts);
    var imageryLayer = L.layerGroup([imgBase, imgLabel]);

    /* 地形晕渲 */
    var terBase = L.tileLayer(tdUrl('ter'), tdOpts);
    var terLabel = L.tileLayer(tdUrl('cta'), tdOpts);
    var terrainLayer = L.layerGroup([terBase, terLabel]);

    /* 默认显示矢量 */
    vectorLayer.addTo(map);

    /* 图层切换控件 */
    L.control.layers({
      '矢量底图': vectorLayer,
      '影像底图': imageryLayer,
      '地形晕渲': terrainLayer
    }, null, { position: 'topright' }).addTo(map);

    /* 瓦片加载失败时显示提示 */
    map.on('tileerror', function (e) {
      var $panel = document.getElementById('panelSubtitle');
      if ($panel && !$panel.dataset.tileWarned) {
        $panel.dataset.tileWarned = '1';
        $panel.textContent = '⚠ 地图瓦片加载失败，请检查网络';
      }
    });

    /* 窗口大小变化时刷新地图尺寸 */
    window.addEventListener('resize', function () {
      if (map) { setTimeout(function () { map.invalidateSize(); }, 200); }
    });
  }

  /* ==================================================================
   *  Data Fetching
   * ================================================================== */

  function fetchRegions() {
    return fetch('/api/regions', { headers: getAuthHeaders() })
      .then(handleUnauthorized)
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (result && result.data && Array.isArray(result.data)) {
          result.data.forEach(function (r) {
            regionMap[r.regionId] = r.name;
          });
          /* Populate region filter dropdown */
          var $filter = document.getElementById('regionFilter');
          if ($filter) {
            result.data.forEach(function (r) {
              var opt = document.createElement('option');
              opt.value = r.regionId;
              opt.textContent = r.name;
              $filter.appendChild(opt);
            });
            $filter.addEventListener('change', onRegionFilterChange);
          }
        }
        return result;
      });
  }

  function fetchPlots() {
    return fetch('/api/plots/all', { headers: getAuthHeaders() })
      .then(handleUnauthorized)
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (result && result.data && Array.isArray(result.data)) {
          allPlots = result.data;
          renderPlots(allPlots);
          updatePanelSubtitle(allPlots.length);
        } else {
          showEmpty();
        }
        return result;
      });
  }

  /* ==================================================================
   *  Render Markers & List
   * ================================================================== */

  function renderPlots(plots) {
    clearMarkers();
    renderList(plots);

    if (!plots || plots.length === 0) {
      showEmpty();
      return;
    }

    var bounds = [];
    plots.forEach(function (plot) {
      if (plot.latitude == null || plot.longitude == null) return;

      var lat = parseFloat(plot.latitude);
      var lng = parseFloat(plot.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      /* Create marker */
      var marker = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: '#2c6e49',
        color: '#1b4332',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85
      }).addTo(map);

      /* Bind popup */
      var regionName = regionMap[plot.regionId] || '';
      var popupHtml = buildPopupContent(plot, regionName);
      marker.bindPopup(popupHtml);

      /* Store reference */
      markers.push({ marker: marker, plot: plot });
      bounds.push([lat, lng]);

      /* On popup open, highlight in sidebar */
      marker.on('popupopen', function () {
        highlightListItem(plot.plotId);
      });
    });

    /* Fit map to show all markers */
    if (bounds.length > 0) {
      var group = L.featureGroup(markers.map(function (m) { return m.marker; }));
      map.fitBounds(group.getBounds().pad(0.15));
    }
  }

  function buildPopupContent(plot, regionName) {
    var treesText = plot.treeCount != null ? plot.treeCount + ' 株' : '—';
    var areaText = plot.area != null ? parseFloat(plot.area).toFixed(2) + ' ha' : '—';
    var elevText = plot.elevation != null ? parseFloat(plot.elevation).toFixed(1) + ' m' : '—';
    var typeText = plot.plotType || '—';
    var yearText = plot.surveyYear || '—';
    var descText = plot.description || '';
    var detailUrl = 'plots.html?plotId=' + plot.plotId;

    return '<div class="plot-popup">' +
      '<h3>' + (regionName || '未知区域') + '</h3>' +
      '<div class="popup-code">' + (plot.plotCode || '') + '</div>' +
      '<div class="popup-row"><span class="popup-label">面积</span><span>' + areaText + '</span></div>' +
      '<div class="popup-row"><span class="popup-label">海拔</span><span>' + elevText + '</span></div>' +
      '<div class="popup-row"><span class="popup-label">类型</span><span>' + typeText + '</span></div>' +
      '<div class="popup-row"><span class="popup-label">调查年份</span><span>' + yearText + '</span></div>' +
      '<div class="popup-row"><span class="popup-label">树木数量</span><span>' + treesText + '</span></div>' +
      (descText ? '<div class="popup-row" style="flex-wrap:wrap"><span class="popup-label">描述</span><span style="font-size:12px;color:var(--color-text-secondary);text-align:right;max-width:120px">' + descText + '</span></div>' : '') +
      '<div class="popup-actions"><a href="' + detailUrl + '">查看详情</a></div>' +
      '</div>';
  }

  /* ==================================================================
   *  Side Panel List
   * ================================================================== */

  function renderList(plots) {
    var $list = document.getElementById('plotList');
    if (!$list) return;

    if (!plots || plots.length === 0) {
      $list.innerHTML = '<div class="empty-msg">该区域暂无样地数据</div>';
      return;
    }

    var html = '';
    plots.forEach(function (plot) {
      var regionName = regionMap[plot.regionId] || '';
      html += '<div class="plot-item" data-plot-id="' + plot.plotId + '" onclick="onPlotItemClick(' + plot.plotId + ')">' +
        '<span class="plot-marker-dot"></span>' +
        '<div class="plot-item-info">' +
        '<div class="plot-item-code">' + (regionName || '—') + '</div>' +
        '<div class="plot-item-meta">' +
          (plot.plotType || '—') +
          (plot.surveyYear ? ' · ' + plot.surveyYear : '') +
        '</div>' +
        '</div>' +
        '<span class="plot-item-region">' + (plot.plotCode || '—') + '</span>' +
        '</div>';
    });
    $list.innerHTML = html;
  }

  function highlightListItem(plotId) {
    var items = document.querySelectorAll('.plot-item');
    items.forEach(function (item) {
      item.classList.toggle('active', parseInt(item.getAttribute('data-plot-id'), 10) === plotId);
    });
  }

  /* Expose to global scope for onclick handlers */
  window.onPlotItemClick = function (plotId) {
    var match = markers.find(function (m) { return m.plot.plotId === plotId; });
    if (match) {
      /* 居中并放大到 12 级 */
      map.setView(match.marker.getLatLng(), 12, { animate: true });
      /* 延迟打开 popup 等待动画完成 */
      setTimeout(function () { match.marker.openPopup(); }, 300);
      /* Highlight */
      highlightListItem(plotId);
    }
  };

  /* ==================================================================
   *  Filter
   * ================================================================== */

  function onRegionFilterChange() {
    var $filter = document.getElementById('regionFilter');
    var regionId = $filter ? $filter.value : '';
    var filtered;

    if (!regionId) {
      filtered = allPlots;
    } else {
      filtered = allPlots.filter(function (p) {
        return p.regionId === parseInt(regionId, 10);
      });
    }

    /* Re-render markers and list */
    renderPlots(filtered);
    updatePanelSubtitle(filtered.length);
  }

  /* ==================================================================
   *  CSV Export
   * ================================================================== */

  function doExport(regionId, bbox) {
    var params = [];
    if (regionId) { params.push('regionId=' + regionId); }
    if (bbox) {
      params.push('minLng=' + bbox.minLng);
      params.push('minLat=' + bbox.minLat);
      params.push('maxLng=' + bbox.maxLng);
      params.push('maxLat=' + bbox.maxLat);
    }
    var url = '/api/plots/export/csv?' + params.join('&');
    var token = getToken();

    /* 用隐藏表单触发下载，自动携带 Authorization */
    var form = document.createElement('form');
    form.method = 'GET';
    form.action = url;
    form.style.display = 'none';
    var input = document.createElement('input');
    input.name = 'token';
    input.value = token || '';
    form.appendChild(input);
    /* 直接 fetch 拿 blob 然后触发下载 (避免 token 在 URL 暴露) */
    fetch(url, { headers: getAuthHeaders() })
      .then(handleUnauthorized)
      .then(function (res) { return res.blob(); })
      .then(function (blob) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'forest-export.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
      })
      .catch(function (err) {
        if (err.message !== 'UNAUTHORIZED') {
          alert('导出失败: ' + err.message);
        }
      });
  }

  /* ==================================================================
   *  Draw Shape Selection (多边形 / 圆形 / 矩形)
   * ================================================================== */

  var drawnLayer = null;          /* 当前绘制的图形 */
  var activeDrawMode = null;     /* 'polygon' | 'circle' | 'rectangle' */
  var currentDrawHandler = null; /* Leaflet.Draw handler 实例 */
  var drawnItems = null;         /* FeatureGroup 存放绘制图形 */
  var selectedPlots = null;      /* 框选选中的样地列表 */

  /** 获取当前筛选后的样地列表（区域过滤器） */
  function getFilteredPlots() {
    var $filter = document.getElementById('regionFilter');
    var regionId = $filter ? $filter.value : '';
    if (!regionId) return allPlots;
    return allPlots.filter(function (p) { return p.regionId === parseInt(regionId, 10); });
  }

  /** 初始化绘制工具 */
  function initDrawTools() {
    drawnItems = L.featureGroup().addTo(map);

    map.on(L.Draw.Event.CREATED, function (e) {
      var layer = e.layer;

      /* 移除之前的绘制图形 */
      drawnItems.clearLayers();
      drawnItems.addLayer(layer);
      drawnLayer = layer;

      /* 按图形过滤样地 */
      filterByDrawnShape(layer);

      /* 退出绘制模式 */
      deactivateDrawMode();
    });
  }

  /** 进入某一种绘制模式 */
  function startDrawMode(mode) {
    /* 如果已有绘制结果，先清除 */
    if (drawnLayer) {
      drawnItems.clearLayers();
      drawnLayer = null;
    }
    var $hint = document.getElementById('toolHint');
    if ($hint) { $hint.classList.remove('visible'); }

    var drawOpts = {
      shapeOptions: {
        color: '#e74c3c',
        weight: 2,
        fillOpacity: 0.12
      }
    };
    var handler;

    switch (mode) {
      case 'polygon':
        handler = new L.Draw.Polygon(map, drawOpts);
        break;
      case 'circle':
        handler = new L.Draw.Circle(map, drawOpts);
        break;
      case 'rectangle':
        handler = new L.Draw.Rectangle(map, drawOpts);
        break;
      default:
        return;
    }

    if (currentDrawHandler) { currentDrawHandler.disable(); }
    handler.enable();
    currentDrawHandler = handler;
    activeDrawMode = mode;
  }

  /** 退出绘制模式 */
  function deactivateDrawMode() {
    if (currentDrawHandler) {
      currentDrawHandler.disable();
      currentDrawHandler = null;
    }
    activeDrawMode = null;
    var $select = document.getElementById('drawModeSelect');
    if ($select) { $select.value = ''; }
  }

  /** 按绘制图形过滤样地 */
  function filterByDrawnShape(layer) {
    var selected = [];
    allPlots.forEach(function (plot) {
      if (plot.latitude == null || plot.longitude == null) return;
      var lat = parseFloat(plot.latitude);
      var lng = parseFloat(plot.longitude);
      if (isNaN(lat) || isNaN(lng)) return;
      if (isPointInShape(lat, lng, layer)) {
        selected.push(plot);
      }
    });

    selectedPlots = selected;
    renderPlots(selected);

    var $sub = document.getElementById('panelSubtitle');
    if ($sub) { $sub.textContent = '样地分布 · 共 ' + getFilteredPlots().length + ' 个 · 已选 ' + selected.length + ' 个'; }

    var $hintText = document.getElementById('toolHintText');
    if ($hintText) { $hintText.textContent = '已选中 ' + selected.length + ' 个样地'; }
    var $hint = document.getElementById('toolHint');
    if ($hint) { $hint.classList.add('visible'); }

    var $clear = document.getElementById('btnClearSelect');
    if ($clear) { $clear.style.display = ''; }

    /* 同步更新预测区的选中信息 */
    updatePredictionInfo();

    /* 加载时序图 */
    loadVolumeTimeSeries();
  }

  /** 判断点是否在图形内 */
  function isPointInShape(lat, lng, layer) {
    /* 圆形：距离中心 <= 半径 */
    if (layer instanceof L.Circle) {
      var center = layer.getLatLng();
      var radius = layer.getRadius();
      return center.distanceTo([lat, lng]) <= radius;
    }
    /* 矩形：bounds.contains */
    if (layer instanceof L.Rectangle) {
      return layer.getBounds().contains([lat, lng]);
    }
    /* 多边形：射线法 */
    if (layer instanceof L.Polygon) {
      var rings = layer.getLatLngs();
      if (!rings || rings.length === 0) return false;
      var ring = rings[0];
      if (!ring || ring.length < 3) return false;
      var inside = false;
      var n = ring.length;
      for (var i = 0, j = n - 1; i < n; j = i++) {
        if ((ring[i].lat > lat) !== (ring[j].lat > lat) &&
            lng < (ring[j].lng - ring[i].lng) * (lat - ring[i].lat) / (ring[j].lat - ring[i].lat) + ring[i].lng) {
          inside = !inside;
        }
      }
      return inside;
    }
    return false;
  }

  /* ========== 全局暴露（供 onclick） ========== */

  window.clearSelection = function () {
    if (drawnLayer) {
      drawnItems.clearLayers();
      drawnLayer = null;
    }
    selectedPlots = null;
    deactivateDrawMode();
    renderPlots(getFilteredPlots());
    updatePanelSubtitle(getFilteredPlots().length);

    var $hint = document.getElementById('toolHint');
    if ($hint) { $hint.classList.remove('visible'); }

    /* 同步更新预测区的选中信息 */
    updatePredictionInfo();

    /* 清空时序图 */
    showChartEmpty();
  };

  window.doExportSelected = function () {
    if (drawnLayer) {
      var b = drawnLayer.getBounds();
      doExport(null, {
        minLng: b.getWest(), minLat: b.getSouth(),
        maxLng: b.getEast(), maxLat: b.getNorth()
      });
    }
  };

  /* ==================================================================
   *  AI Volume Prediction
   * ================================================================== */

  var $predictModelSelect;
  var $btnPredictSelected;
  var $btnPredictAll;
  var $predictResult;
  var $predictSelectionInfo;

  function initPrediction() {
    $predictModelSelect = document.getElementById('predictModelSelect');
    $btnPredictSelected = document.getElementById('btnPredictSelected');
    $btnPredictAll = document.getElementById('btnPredictAll');
    $predictResult = document.getElementById('predictResult');
    $predictSelectionInfo = document.getElementById('predictSelectionInfo');

    if (!$btnPredictSelected) return;

    /* Wire buttons */
    $btnPredictSelected.addEventListener('click', handlePredictSelected);
    if ($btnPredictAll) {
      $btnPredictAll.addEventListener('click', handleBatchPrediction);
    }

    /* Fetch models */
    fetchModels();
  }

  function updatePredictionInfo() {
    if (!$predictSelectionInfo) return;
    if (selectedPlots && selectedPlots.length > 0) {
      $predictSelectionInfo.textContent = '已框选 ' + selectedPlots.length + ' 个样地，点击⚡预测选中';
      $predictSelectionInfo.style.color = 'var(--color-primary-dark, #1b4332)';
      $predictSelectionInfo.style.fontWeight = '600';
      $btnPredictSelected.disabled = false;
    } else {
      $predictSelectionInfo.textContent = '请用框选工具在地图上选择样地';
      $predictSelectionInfo.style.color = 'var(--color-text-muted, #b2bec3)';
      $predictSelectionInfo.style.fontWeight = '';
      $btnPredictSelected.disabled = true;
    }
  }

  function fetchModels() {
    if (!$predictModelSelect) return;
    $predictModelSelect.innerHTML = '<option value="">-- 加载中 --</option>';

    fetch('/api/models', { headers: getAuthHeaders() })
      .then(handleUnauthorized)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.code === 200 && data.data) {
          renderModelOptions(data.data);
        } else {
          $predictModelSelect.innerHTML = '<option value="">-- 暂无可用模型 --</option>';
        }
      })
      .catch(function (err) {
        if (err.message !== 'UNAUTHORIZED') {
          $predictModelSelect.innerHTML = '<option value="">-- 加载失败 --</option>';
        }
      });
  }

  function renderModelOptions(models) {
    if (!$predictModelSelect) return;
    $predictModelSelect.innerHTML = '';
    if (!models || models.length === 0) {
      $predictModelSelect.innerHTML = '<option value="">-- 暂无可用模型 --</option>';
      return;
    }
    models.forEach(function (m) {
      var opt = document.createElement('option');
      opt.value = m.modelId;
      opt.textContent = m.modelName + ' (' + m.algorithm + ')';
      $predictModelSelect.appendChild(opt);
    });
  }

  /** 预测框选中的所有样地 — 结果直接标在每条样地上 */
  function handlePredictSelected() {
    if (!$predictModelSelect) return;
    var modelId = $predictModelSelect.value;
    if (!modelId) { showPredictResult('请先选择一个AI模型', true); return; }
    if (!selectedPlots || selectedPlots.length === 0) {
      showPredictResult('请先用框选工具在地图上选择样地', true);
      return;
    }
    predictPlots(selectedPlots, modelId);
  }

  function handleBatchPrediction() {
    if (!$predictModelSelect) return;
    var modelId = $predictModelSelect.value;
    if (!modelId) { showPredictResult('请先选择一个AI模型', true); return; }
    predictPlots(null, modelId);
  }

  /** 预测全部（批量API）或逐个预测选中 */
  function predictPlots(plots, modelId) {
    /* 批量模式 — 调后端 predict-all */
    if (plots === null) {
      setAllButtonsDisabled(true);
      showPredictResult('正在预测全部样地...', false);
      showProgress(null, null, true);

      fetch('/api/ai-predictions/predict-all?modelId=' + modelId, {
        method: 'POST',
        headers: getAuthHeaders()
      })
        .then(handleUnauthorized)
        .then(function (res) { return res.json(); })
        .then(function (data) {
          restoreButtons();
          if (data.code === 200 && data.data && data.data.length > 0) {
            showPredictResult('预测完成，共 ' + data.data.length + ' 个样地', false);
          } else if (data.code === 200) {
            showPredictResult('预测完成，但全部样地预测失败（请检查 Flask 服务及样地数据）', true);
          } else {
            showPredictResult(data.message || '预测失败', true);
          }
        })
        .catch(function () {
          restoreButtons();
          showPredictResult('网络错误', true);
        });
      return;
    }

    /* 选中模式：逐个预测，结果标在地图上 */
    setAllButtonsDisabled(true);
    showPredictResult('正在预测 ' + plots.length + ' 个样地...', false);

    var total = plots.length;
    var successCount = 0;

    function predictNext(index) {
      if (index >= total) {
        restoreButtons();
        if (successCount === 0 && total > 0) {
          showPredictResult('预测失败：' + total + ' 个样地全部失败（请检查 Flask 服务及样地数据）', true);
        } else {
          showPredictResult('预测完成：' + successCount + '/' + total + ' 个成功', false);
        }
        showProgress(null, null, false);
        return;
      }
      showProgress(index + 1, total, true);

      var plot = plots[index];
      fetch('/api/ai-predictions/predict/' + plot.plotId + '?modelId=' + modelId, {
        method: 'POST',
        headers: getAuthHeaders()
      })
        .then(handleUnauthorized)
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.code === 200 && data.data) {
            successCount++;
            updatePlotItemResult(plot.plotId, data.data);
          } else {
            updatePlotItemResult(plot.plotId, null);
          }
          predictNext(index + 1);
        })
        .catch(function () {
          updatePlotItemResult(plot.plotId, null);
          predictNext(index + 1);
        });
    }

    predictNext(0);
  }

  /** 在样地列表条目上标注预测结果 */
  function updatePlotItemResult(plotId, result) {
    var items = document.querySelectorAll('.plot-item');
    for (var i = 0; i < items.length; i++) {
      if (parseInt(items[i].getAttribute('data-plot-id'), 10) === plotId) {
        /* 移除旧的预测结果 */
        var old = items[i].querySelector('.plot-item-predict');
        if (old) { old.remove(); }

        var div = document.createElement('div');
        div.className = 'plot-item-predict';
        if (result) {
          div.innerHTML = '🤖 AI预测: <span class="pr-success">' + formatNumber(result.predictedVolume) + ' m³</span>';
        } else {
          div.innerHTML = '<span class="pr-fail">🤖 预测失败</span>';
        }
        items[i].querySelector('.plot-item-info').appendChild(div);
        break;
      }
    }
  }

  /** 在预测结果显示区域显示进度/状态 */
  function showPredictResult(msg, isError) {
    if (!$predictResult) return;
    $predictResult.textContent = msg;
    $predictResult.style.color = isError ? '#c0392b' : 'var(--color-text-muted, #b2bec3)';
    $predictResult.classList.add('visible');
  }

  /** 更新 predictionInfo 为进度信息 */
  function showProgress(done, total, active) {
    if (!$predictSelectionInfo) return;
    if (!active) {
      /* 恢复为选择状态信息 */
      updatePredictionInfo();
      return;
    }
    $predictSelectionInfo.textContent = '预测中 ' + done + '/' + total + ' ...';
    $predictSelectionInfo.style.color = 'var(--color-primary-dark, #1b4332)';
    $predictSelectionInfo.style.fontWeight = '600';
  }

  function setAllButtonsDisabled(disabled) {
    if ($btnPredictSelected) { $btnPredictSelected.disabled = disabled; }
    if ($btnPredictAll) { $btnPredictAll.disabled = disabled; }
  }

  function restoreButtons() {
    if ($btnPredictAll) { $btnPredictAll.disabled = false; }
    if ($btnPredictSelected) {
      $btnPredictSelected.disabled = (selectedPlots && selectedPlots.length > 0) ? false : true;
    }
  }

  function formatNumber(value) {
    if (value == null || isNaN(value)) return '-';
    return Number(value).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function escapeHtml(str) {
    if (str == null) return '-';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ==================================================================
   *  Volume Time-Series Chart
   * ================================================================== */

  var volumeChart = null;

  /** 初始化 ECharts 时序图 */
  function initVolumeChart() {
    var $container = document.getElementById('volumeChart');
    if (!$container) return;

    volumeChart = echarts.init($container);

    window.addEventListener('resize', function () {
      if (volumeChart) { volumeChart.resize(); }
    });

    showChartEmpty();
  }

  /** 显示空状态（无数据/无选择） */
  function showChartEmpty() {
    var $chart = document.getElementById('volumeChart');
    var $empty = document.getElementById('chartEmpty');
    if ($chart) { $chart.style.display = 'none'; }
    if ($empty) { $empty.style.display = 'block'; }
    if (volumeChart) { volumeChart.clear(); }
  }

  /** 显示加载中 */
  function showChartLoading() {
    var $chart = document.getElementById('volumeChart');
    var $empty = document.getElementById('chartEmpty');
    if ($chart) { $chart.style.display = 'block'; }
    if ($empty) { $empty.style.display = 'none'; }
    if (volumeChart) {
      volumeChart.showLoading('default', {
        text: '加载中…',
        color: '#2c6e49',
        textColor: '#636e72',
        maskColor: 'rgba(255,255,255,0.8)',
        fontSize: 12
      });
    }
  }

  /** 加载选中样地的蓄积量时序数据并绘制图表 */
  function loadVolumeTimeSeries() {
    if (!selectedPlots || selectedPlots.length === 0) {
      showChartEmpty();
      return;
    }

    showChartLoading();

    var plotIds = selectedPlots.map(function (p) { return p.plotId; });

    /* 并行请求每个样地的蓄积量数据 */
    var fetches = plotIds.map(function (plotId) {
      return fetch('/api/volumes/plot/' + plotId, { headers: getAuthHeaders() })
        .then(handleUnauthorized)
        .then(function (res) { return res.json(); })
        .then(function (result) {
          if (result && result.data && Array.isArray(result.data)) {
            return { plotId: plotId, volumes: result.data };
          }
          return { plotId: plotId, volumes: [] };
        })
        .catch(function () {
          return { plotId: plotId, volumes: [] };
        });
    });

    /* 所有请求完成后，按年份汇总 */
    Promise.all(fetches).then(function (results) {
      var yearMap = {};

      results.forEach(function (r) {
        r.volumes.forEach(function (v) {
          if (!v.measureDate) return;
          var year = v.measureDate.substring(0, 4);
          var vol = parseFloat(v.measuredVolume) || 0;
          yearMap[year] = (yearMap[year] || 0) + vol;
        });
      });

      var years = Object.keys(yearMap).sort();
      if (years.length === 0) {
        showChartEmpty();
        return;
      }

      var values = years.map(function (y) { return yearMap[y]; });
      updateVolumeChart(years, values);
    });
  }

  /** 绘制/更新 ECharts 折线图 */
  function updateVolumeChart(years, values) {
    var $chart = document.getElementById('volumeChart');
    var $empty = document.getElementById('chartEmpty');
    if ($chart) { $chart.style.display = 'block'; }
    if ($empty) { $empty.style.display = 'none'; }

    if (!volumeChart) {
      volumeChart = echarts.init($chart);
      window.addEventListener('resize', function () {
        if (volumeChart) { volumeChart.resize(); }
      });
    }

    volumeChart.hideLoading();

    var option = {
      tooltip: {
        trigger: 'axis',
        formatter: function (params) {
          var p = params[0];
          if (!p) return '';
          return p.axisValue + ' 年<br/>蓄积量: <strong>' +
            Number(p.value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
            ' m³</strong>';
        }
      },
      grid: {
        left: '3%',
        right: '6%',
        bottom: '8%',
        top: '8%',
        containLabel: false
      },
      xAxis: {
        type: 'category',
        data: years,
        axisLabel: { fontSize: 10, color: '#636e72' },
        axisLine: { lineStyle: { color: '#dde5db' } },
        axisTick: { alignWithLabel: true }
      },
      yAxis: {
        type: 'value',
        name: 'm³',
        nameTextStyle: { fontSize: 10, color: '#b2bec3' },
        axisLabel: { fontSize: 10, color: '#636e72' },
        splitLine: { lineStyle: { color: '#f0f4f0', type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      series: [{
        data: values,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 2, color: '#2c6e49' },
        itemStyle: { color: '#2c6e49' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(44,110,73,0.25)' },
              { offset: 1, color: 'rgba(44,110,73,0.02)' }
            ]
          }
        }
      }]
    };

    volumeChart.setOption(option, true);
  }

  /* ==================================================================
   *  Utility
   * ================================================================== */

  function clearMarkers() {
    markers.forEach(function (m) {
      map.removeLayer(m.marker);
    });
    markers = [];
  }

  function updatePanelSubtitle(count) {
    var $sub = document.getElementById('panelSubtitle');
    if ($sub) {
      $sub.textContent = '共 ' + count + ' 个样地';
    }
  }

  function showEmpty() {
    var $list = document.getElementById('plotList');
    if ($list) {
      $list.innerHTML = '<div class="empty-msg">暂无样地数据</div>';
    }
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

    /* 2. Display username */
    var username = localStorage.getItem(USERNAME_KEY) || '用户';
    var $usernameDisplay = document.getElementById('navbarUsername');
    if ($usernameDisplay) {
      $usernameDisplay.textContent = username;
    }

    /* 3. Init map */
    initMap();

    /* 4. Fetch regions, then fetch plots */
    fetchRegions()
      .then(function () {
        return fetchPlots();
      })
      .then(function () {
        /* 5. Wire up export buttons */
        var $btnExport = document.getElementById('btnExportCsv');
        if ($btnExport) {
          $btnExport.addEventListener('click', function () {
            /* 如果有绘制图形，导出框选区域；否则按区域筛选导出 */
            if (drawnLayer) {
              window.doExportSelected();
            } else {
              var $filter = document.getElementById('regionFilter');
              var regionId = $filter && $filter.value ? $filter.value : null;
              doExport(regionId, null);
            }
          });
        }

        /* 6. Draw mode dropdown */
        var $drawSelect = document.getElementById('drawModeSelect');
        if ($drawSelect) {
          $drawSelect.addEventListener('change', function () {
            var mode = this.value;
            if (mode) {
              startDrawMode(mode);
            }
          });
        }

        var $clearBtn = document.getElementById('btnClearSelect');
        if ($clearBtn) {
          $clearBtn.addEventListener('click', window.clearSelection);
        }

        /* 7. Init Leaflet Draw */
        initDrawTools();

        /* 8. Init AI prediction section */
        initPrediction();

        /* 9. Init volume time-series chart */
        initVolumeChart();
      })
      .catch(function (err) {
        if (err.message !== 'UNAUTHORIZED') {
          console.error('map.js init error:', err);
        }
      });
  }

  /* ==================================================================
   *  Wire-up
   * ================================================================== */

  /* Logout button */
  document.addEventListener('DOMContentLoaded', function () {
    var $logoutBtn = document.getElementById('btnLogout');
    if ($logoutBtn) {
      $logoutBtn.addEventListener('click', handleLogout);
    }
  });

  /* Start when DOM ready — or immediately if already loaded */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
