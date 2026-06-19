/**
 * dashboard.js — 森林资源调查系统 仪表盘
 *
 * Responsibilities:
 *   1. Auth guard (check jwt_token → redirect login.html)
 *   2. Fetch GET /api/statistics/dashboard
 *   3. Render stats cards, bar chart (with mode toggle), pie chart (with mode toggle)
 *   4. Handle loading / error / token-expiry states
 *
 * Dependencies:
 *   - ECharts 5 (loaded via <script> in dashboard.html)
 *   - style.css design tokens (CSS variables)
 */

(function () {
  'use strict';

  /* ==================================================================
   *  State
   * ================================================================== */
  var barChartInstance = null;
  var pieChartInstance = null;
  var dashboardData = null;        /* cached full API response for toggle switching */
  var barChartMode = 'volume';     /* 'volume' | 'plots' | 'trees' */
  var pieChartMode = 'count';      /* 'count' | 'volume' */

  /* ==================================================================
   *  DOM References
   * ================================================================== */
  var $loadingOverlay  = document.getElementById('loadingOverlay');
  var $errorSection    = document.getElementById('errorSection');
  var $errorMsg        = document.getElementById('errorMsg');
  var $errorDetail     = document.getElementById('errorDetail');
  var $dashboardContent = document.getElementById('dashboardContent');
  var $btnRetry        = document.getElementById('btnRetry');
  var $btnLogout       = document.getElementById('btnLogout');
  var $navbarUsername  = document.getElementById('navbarUsername');

  /* Stats card values */
  var $statTotalPlots   = document.getElementById('statTotalPlots');
  var $statTotalTrees   = document.getElementById('statTotalTrees');
  var $statTotalVolume  = document.getElementById('statTotalVolume');
  var $statRegionCount  = document.getElementById('statRegionCount');

  /* ==================================================================
   *  UI Helpers
   * ================================================================== */

  /** Show loading spinner, hide everything else */
  function showLoading() {
    $loadingOverlay.classList.remove('hidden');
    $errorSection.classList.add('hidden');
    $dashboardContent.classList.add('hidden');
  }

  /** Show error state with message */
  function showError(message, detail) {
    $loadingOverlay.classList.add('hidden');
    $errorSection.classList.remove('hidden');
    $dashboardContent.classList.add('hidden');
    $errorMsg.textContent = message || '数据加载失败';
    $errorDetail.textContent = detail || '';
  }

  /** Show dashboard content */
  function showDashboard() {
    $loadingOverlay.classList.add('hidden');
    $errorSection.classList.add('hidden');
    $dashboardContent.classList.remove('hidden');
  }

  /** Get JWT token from localStorage */
  function getToken() {
    /* login.html stores the token as 'jwt_token' */
    return localStorage.getItem('jwt_token');
  }

  /** Redirect to login page */
  function redirectToLogin() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
  }

  /** Get Authorization header object */
  function authHeaders() {
    var token = getToken();
    return token ? { 'Authorization': 'Bearer ' + token } : {};
  }

  /** Format a number to 2 decimal places, or return placeholder */
  function fmtNum(val) {
    if (val == null || isNaN(val)) return '—';
    return Number(val).toFixed(2);
  }

  /** Format integer */
  function fmtInt(val) {
    if (val == null || isNaN(val)) return '—';
    return Number(val).toLocaleString('zh-CN');
  }

  /* ==================================================================
   *  Bar Chart Rendering (with mode toggle)
   * ================================================================== */

  /**
   * Render the bar chart with the selected mode.
   * @param {Array} regionData - array of {regionName, plotCount, treeCount, totalMeasuredVolume, totalPredictedVolume}
   * @param {string} mode - 'volume' | 'plots' | 'trees'
   */
  /** Get level label for display */
  function getLevelLabel(level) {
    if (level === 1) return '省级';
    if (level === 2) return '市级';
    if (level === 3) return '区县';
    return 'Lv' + (level || '?');
  }

  /** Get bar color by level */
  function getLevelColor(level, shade) {
    shade = shade || 0;
    var palette = {
      1: ['#1b4332', '#2d6a4f', '#40916c'], /* Province: dark forest green */
      2: ['#2c6e49', '#3e8e5c', '#52ae70'], /* City: medium green */
      3: ['#4c956c', '#68b082', '#84ca98'], /* District: light green */
      4: ['#74a57f', '#90be99', '#acd7b3']  /* Other: pale green */
    };
    var colors = palette[level] || palette[4];
    return colors[shade % colors.length];
  }

  function renderBarChart(regionData, mode) {
    mode = mode || barChartMode;
    barChartMode = mode;

    var el = document.getElementById('barChart');
    if (!el) return;

    /* Dispose previous instance */
    if (barChartInstance) {
      barChartInstance.dispose();
    }

    if (!regionData || regionData.length === 0) {
      el.innerHTML = '<p class="text-muted text-center" style="padding-top:120px;">暂无区域数据</p>';
      return;
    }

    /* Filter out regions with no data (empty provinces) */
    var hasData = function (r) {
      return (r.plotCount && r.plotCount > 0) ||
             (r.totalMeasuredVolume && Number(r.totalMeasuredVolume) > 0) ||
             (r.totalPredictedVolume && Number(r.totalPredictedVolume) > 0);
    };
    var filteredData = regionData.filter(hasData);

    if (filteredData.length === 0) {
      el.innerHTML = '<p class="text-muted text-center" style="padding-top:120px;">暂无有效区域数据</p>';
      return;
    }

    barChartInstance = echarts.init(el);

    /* Build x-axis labels */
    var regions = filteredData.map(function (r) {
      return r.regionName || '未知';
    });

    var series, yAxisName, legendItems, tooltipFormatter;

    if (mode === 'volume') {
      /* Side-by-side: measured vs predicted, color-coded by level */
      var measured  = filteredData.map(function (r) { return (r.totalMeasuredVolume  != null) ? Number(r.totalMeasuredVolume)  : 0; });
      var predicted = filteredData.map(function (r) { return (r.totalPredictedVolume != null) ? Number(r.totalPredictedVolume) : 0; });
      yAxisName = '蓄积量 (m³)';
      legendItems = [
        { name: '实测蓄积量', itemStyle: { color: '#2c6e49' } },
        { name: '预测蓄积量', itemStyle: { color: '#3498db' } }
      ];

      /* Build bar items with series-level colors matching legend */
      var measuredBars = {
        name: '实测蓄积量',
        type: 'bar',
        data: filteredData.map(function (r, i) {
          return {
            value: Number(r.totalMeasuredVolume != null ? r.totalMeasuredVolume : 0),
            itemStyle: { color: '#2c6e49' }
          };
        }),
        barWidth: filteredData.length > 5 ? 18 : 28,
        barGap: '20%'
      };
      var predictedBars = {
        name: '预测蓄积量',
        type: 'bar',
        data: filteredData.map(function (r, i) {
          return {
            value: Number(r.totalPredictedVolume != null ? r.totalPredictedVolume : 0),
            itemStyle: { color: '#3498db' }
          };
        }),
        barWidth: filteredData.length > 5 ? 18 : 28,
        barGap: '20%'
      };
      series = [measuredBars, predictedBars];
    } else if (mode === 'plots') {
      /* Single bar: plot count, color by level */
      yAxisName = '样地数';
      legendItems = [];
      series = [{
        name: '样地数量',
        type: 'bar',
        data: filteredData.map(function (r) {
          return {
            value: r.plotCount || 0,
            itemStyle: {
              color: getLevelColor(r.regionLevel, 0)
            }
          };
        }),
        barWidth: filteredData.length > 5 ? 18 : 36
      }];
    } else {
      /* Single bar: tree count, color by level */
      yAxisName = '树木数';
      legendItems = [];
      series = [{
        name: '树木数量',
        type: 'bar',
        data: filteredData.map(function (r) {
          return {
            value: r.treeCount || 0,
            itemStyle: {
              color: getLevelColor(r.regionLevel, 0)
            }
          };
        }),
        barWidth: filteredData.length > 5 ? 18 : 36
      }];
    }

    var option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(27, 67, 50, 0.92)',
        borderColor: 'transparent',
        textStyle: { color: '#fff', fontSize: 13 },
        formatter: function (params) {
          if (!params || params.length === 0) return '';
          var tip = '<strong>' + params[0].name + '</strong><br/>';
          params.forEach(function (p) {
            var val = (mode === 'volume') ? p.value.toFixed(2) + ' m³' : p.value;
            tip += p.marker + ' ' + p.seriesName + ': <b>' + val + '</b><br/>';
          });
          return tip;
        }
      },
      legend: {
        data: legendItems,
        top: 0,
        textStyle: { color: '#636e72', fontSize: 12 },
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 20
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '8%',
        top: '40px',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: regions,
        axisLabel: {
          color: '#636e72',
          fontSize: 11,
          rotate: filteredData.length > 6 ? 30 : 0,
          interval: 0
        },
        axisTick: { alignWithLabel: true },
        axisLine: { lineStyle: { color: '#dde5db' } }
      },
      yAxis: {
        type: 'value',
        name: yAxisName,
        nameTextStyle: { color: '#636e72', fontSize: 12 },
        axisLabel: { color: '#636e72', fontSize: 11 },
        splitLine: { lineStyle: { color: '#eef2ed', type: 'dashed' } }
      },
      series: series,
      animationDuration: 800,
      animationEasing: 'cubicOut'
    };

    barChartInstance.setOption(option);

    /* Responsive resize */
    window.addEventListener('resize', function () {
      if (barChartInstance && !barChartInstance.isDisposed()) {
        barChartInstance.resize();
      }
    });
  }

  /* ==================================================================
   *  Pie Chart Rendering (with mode toggle)
   * ================================================================== */

  /**
   * Render the pie chart for species distribution.
   * @param {Object} speciesData - Map of species → value
   * @param {string} mode - 'count' (tree count) | 'volume' (measured volume)
   */
  function renderPieChart(speciesData, mode) {
    mode = mode || pieChartMode;
    pieChartMode = mode;

    var el = document.getElementById('pieChart');
    if (!el) return;

    if (pieChartInstance) {
      pieChartInstance.dispose();
    }

    if (!speciesData || Object.keys(speciesData).length === 0) {
      el.innerHTML = '<p class="text-muted text-center" style="padding-top:120px;">暂无树种数据</p>';
      return;
    }

    pieChartInstance = echarts.init(el);

    /* Build data array sorted descending by value */
    var pieData = Object.keys(speciesData)
      .map(function (key) {
        return { name: key, value: Number(speciesData[key]) };
      })
      .sort(function (a, b) { return b.value - a.value; });

    var valueLabel = (mode === 'count') ? '株数' : '蓄积量 (m³)';
    var isVolume = mode === 'volume';

    /* Forest-themed color palette */
    var pieColors = [
      '#2c6e49', '#4c956c', '#74a57f', '#9fc5a8',
      '#3498db', '#5dade2', '#27ae60', '#52be80',
      '#f39c12', '#f5b041', '#e67e22', '#eb984e'
    ];

    var option = {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(27, 67, 50, 0.92)',
        borderColor: 'transparent',
        textStyle: { color: '#fff', fontSize: 13 },
        formatter: function (p) {
          if (isVolume) {
            return '<strong>' + p.name + '</strong><br/>' + valueLabel + ': <b>' + Number(p.value).toFixed(2) + '</b> (' + p.percent + '%)';
          }
          return '<strong>' + p.name + '</strong><br/>' + valueLabel + ': <b>' + p.value + '</b> (' + p.percent + '%)';
        }
      },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        right: 10,
        top: 'center',
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 10,
        textStyle: { color: '#636e72', fontSize: 11 },
        formatter: function (name) {
          return name.length > 6 ? name.slice(0, 6) + '...' : name;
        }
      },
      series: [
        {
          name: '树种分布',
          type: 'pie',
          radius: ['48%', '78%'],
          center: ['40%', '52%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            position: 'outside',
            formatter: isVolume
              ? function (p) { return p.name + '\n' + Number(p.value).toFixed(1) + ' m³'; }
              : '{b}\n{d}%',
            fontSize: 11,
            color: '#636e72',
            lineHeight: 16
          },
          emphasis: {
            label: { fontSize: 14, fontWeight: 'bold' },
            scaleSize: 8
          },
          labelLine: {
            length: 18,
            length2: 24,
            lineStyle: { color: '#b2bec3' }
          },
          data: pieData,
          color: pieColors,
          animationType: 'scale',
          animationEasing: 'elasticOut',
          animationDelay: function (idx) {
            return idx * 80;
          }
        }
      ]
    };

    pieChartInstance.setOption(option);

    window.addEventListener('resize', function () {
      if (pieChartInstance && !pieChartInstance.isDisposed()) {
        pieChartInstance.resize();
      }
    });
  }

  /* ==================================================================
   *  Chart Toggle Binding
   * ================================================================== */

  function bindChartToggles() {
    /* Bar chart toggles */
    var barToggles = document.querySelectorAll('#barChartToggle .chart-toggle');
    barToggles.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!dashboardData) return;
        barToggles.forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        barChartMode = this.getAttribute('data-mode');
        renderBarChart(dashboardData.regionComparison, barChartMode);
        if (barChartInstance && !barChartInstance.isDisposed()) {
          setTimeout(function () { barChartInstance.resize(); }, 50);
        }
      });
    });

    /* Pie chart toggles */
    var pieToggles = document.querySelectorAll('#pieChartToggle .chart-toggle');
    pieToggles.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!dashboardData) return;
        pieToggles.forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        pieChartMode = this.getAttribute('data-mode');
        var pieSrc = (pieChartMode === 'count')
          ? dashboardData.speciesDistribution
          : dashboardData.speciesVolume;
        renderPieChart(pieSrc, pieChartMode);
        if (pieChartInstance && !pieChartInstance.isDisposed()) {
          setTimeout(function () { pieChartInstance.resize(); }, 50);
        }
      });
    });
  }

  /* ==================================================================
   *  Stats Cards Rendering
   * ================================================================== */

  /**
   * Render the four summary statistics cards.
   * @param {Object} stats - { totalPlots, totalTrees, totalVolume, regionCount }
   */
  function renderStatsCards(stats) {
    if (!stats) {
      $statTotalPlots.textContent  = '—';
      $statTotalTrees.textContent  = '—';
      $statTotalVolume.textContent = '—';
      $statRegionCount.textContent = '—';
      return;
    }

    $statTotalPlots.textContent  = fmtInt(stats.totalPlots);
    $statTotalTrees.textContent  = fmtInt(stats.totalTrees);
    $statTotalVolume.textContent = fmtNum(stats.totalVolume);
    $statRegionCount.textContent = fmtInt(stats.regionCount);
  }

  /* ==================================================================
   *  Data Fetching
   * ================================================================== */

  /**
   * Fetch dashboard data from the API.
   * @returns {Promise<Object>} Parsed dashboard data object.
   */
  function fetchDashboardData() {
    var token = getToken();
    if (!token) {
      redirectToLogin();
      return Promise.reject(new Error('未登录'));
    }

    return fetch('/api/statistics/dashboard', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    })
    .then(function (res) {
      if (res.status === 401) {
        redirectToLogin();
        throw new Error('登录已过期，请重新登录');
      }
      if (!res.ok) {
        throw new Error('服务器错误 (' + res.status + ')');
      }
      return res.json();
    })
    .then(function (json) {
      if (json.code !== 200) {
        throw new Error(json.message || '请求失败');
      }
      if (!json.data) {
        throw new Error('返回数据为空');
      }
      return json.data;
    });
  }

  /**
   * Fetch regions list to get level info, then merge into dashboard data.
   */
  function fetchRegionsAndMerge(dashboardData) {
    var token = getToken();
    if (!token) return Promise.resolve(dashboardData);

    return fetch('/api/regions', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(function (res) { return res.json(); })
    .then(function (json) {
      if (json.code === 200 && json.data) {
        var levelMap = {};
        json.data.forEach(function (r) {
          levelMap[r.regionId || r.id] = r.level || 1;
        });
        if (dashboardData.regionComparison) {
          dashboardData.regionComparison.forEach(function (r) {
            r.regionLevel = levelMap[r.regionId] || 1;
          });
        }
      }
      return dashboardData;
    })
    .catch(function () {
      return dashboardData;
    });
  }

  /* ==================================================================
   *  Initialization
   * ================================================================== */

  /** Main entry point */
  function initDashboard() {
    /* 1. Auth guard */
    var token = getToken();
    if (!token) {
      redirectToLogin();
      return;
    }

    /* Display username from localStorage */
    var username = localStorage.getItem('username') || '用户';
    if ($navbarUsername) {
      $navbarUsername.textContent = username;
    }

    /* 2. Show loading */
    showLoading();

    /* 3. Bind chart toggles once */
    bindChartToggles();

    /* 4. Fetch and render */
    fetchDashboardData()
      .then(function (data) {
        return fetchRegionsAndMerge(data);
      })
      .then(function (data) {
        dashboardData = data;

        /* Render stats cards */
        renderStatsCards(data.totalStats);

        /* Render charts with default modes */
        renderBarChart(data.regionComparison, 'volume');
        renderPieChart(data.speciesDistribution, 'count');

        /* Show dashboard */
        showDashboard();

        /* Fix: charts initialized in hidden container get width=0.
           After showing dashboard, trigger resize to recalculate dimensions. */
        setTimeout(function () {
          if (barChartInstance && !barChartInstance.isDisposed()) {
            barChartInstance.resize();
          }
          if (pieChartInstance && !pieChartInstance.isDisposed()) {
            pieChartInstance.resize();
          }
        }, 100);
      })
      .catch(function (err) {
        console.error('Dashboard load failed:', err);
        showError('数据加载失败', err.message || '请检查网络连接后重试');
      });
  }

  /* ==================================================================
   *  Event Bindings
   * ================================================================== */

  /* Retry button */
  if ($btnRetry) {
    $btnRetry.addEventListener('click', function () {
      initDashboard();
    });
  }

  /* Logout button */
  if ($btnLogout) {
    $btnLogout.addEventListener('click', function () {
      if (confirm('确定要退出登录吗？')) {
        redirectToLogin();
      }
    });
  }

  /* ==================================================================
   *  Profile Modal Logic
   * ================================================================== */

  var $profileModal     = document.getElementById('profileModal');
  var $modalCloseBtn    = document.getElementById('modalCloseBtn');
  var $profileTrigger   = document.getElementById('profileTrigger');
  var $modalUsername    = document.getElementById('modalUsername');
  var $modalRealName    = document.getElementById('modalRealName');
  var $modalPhone       = document.getElementById('modalPhone');
  var $btnSaveProfile   = document.getElementById('btnSaveProfile');
  var $modalOldPwd      = document.getElementById('modalOldPwd');
  var $modalNewPwd      = document.getElementById('modalNewPwd');
  var $modalConfirmPwd  = document.getElementById('modalConfirmPwd');
  var $btnChangePwd     = document.getElementById('btnChangePwd');
  var $profileMsg       = document.getElementById('profileMsg');
  var $passwordMsg      = document.getElementById('passwordMsg');

  /** Show inline message inside modal */
  function showModalMsg(el, type, text) {
    el.className = 'modal-msg ' + type;
    el.textContent = text;
    el.style.display = 'block';
  }

  /** Clear all modal messages */
  function clearModalMsgs() {
    [$profileMsg, $passwordMsg].forEach(function (el) {
      el.className = 'modal-msg';
      el.textContent = '';
      el.style.display = 'none';
    });
  }

  /** Open profile modal and load user data */
  function openProfileModal() {
    clearModalMsgs();

    var token = getToken();
    if (!token) { redirectToLogin(); return; }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/auth/me', true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.onload = function () {
      if (xhr.status === 401) { redirectToLogin(); return; }
      try {
        var resp = JSON.parse(xhr.responseText);
        if (resp.code === 200 && resp.data) {
          $modalUsername.value = resp.data.username || '';
          $modalRealName.value = resp.data.realName || '';
          $modalPhone.value    = resp.data.phone || '';
        } else {
          showModalMsg($profileMsg, 'error', resp.message || '加载用户信息失败');
        }
      } catch (e) {
        showModalMsg($profileMsg, 'error', '数据解析失败');
      }
    };
    xhr.onerror = function () {
      showModalMsg($profileMsg, 'error', '网络请求失败');
    };
    xhr.send();

    $profileModal.classList.add('active');
  }

  /** Close profile modal */
  function closeProfileModal() {
    $profileModal.classList.remove('active');
    /* Clear password fields */
    $modalOldPwd.value = '';
    $modalNewPwd.value = '';
    $modalConfirmPwd.value = '';
    clearModalMsgs();
  }

  /** Save profile (realName, phone) */
  function saveProfile() {
    clearModalMsgs();
    var token = getToken();
    if (!token) { redirectToLogin(); return; }

    var realName = $modalRealName.value.trim();
    var phone = $modalPhone.value.trim();

    $btnSaveProfile.disabled = true;
    $btnSaveProfile.classList.add('loading');

    var xhr = new XMLHttpRequest();
    xhr.open('PUT', '/api/auth/profile', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.onload = function () {
      $btnSaveProfile.disabled = false;
      $btnSaveProfile.classList.remove('loading');
      if (xhr.status === 401) { redirectToLogin(); return; }
      try {
        var resp = JSON.parse(xhr.responseText);
        if (resp.code === 200) {
          showModalMsg($profileMsg, 'success', '个人信息修改成功');
        } else {
          showModalMsg($profileMsg, 'error', resp.message || '保存失败');
        }
      } catch (e) {
        showModalMsg($profileMsg, 'error', '数据解析失败');
      }
    };
    xhr.onerror = function () {
      $btnSaveProfile.disabled = false;
      $btnSaveProfile.classList.remove('loading');
      showModalMsg($profileMsg, 'error', '网络请求失败');
    };
    xhr.send(JSON.stringify({ realName: realName, phone: phone }));
  }

  /** Change password */
  function changePassword() {
    clearModalMsgs();
    var token = getToken();
    if (!token) { redirectToLogin(); return; }

    var oldPwd    = $modalOldPwd.value;
    var newPwd    = $modalNewPwd.value;
    var confirmPwd = $modalConfirmPwd.value;

    /* Client-side validation */
    if (!oldPwd) {
      showModalMsg($passwordMsg, 'error', '请输入原密码');
      return;
    }
    if (!newPwd) {
      showModalMsg($passwordMsg, 'error', '请输入新密码');
      return;
    }
    if (newPwd.length < 6) {
      showModalMsg($passwordMsg, 'error', '新密码至少6位');
      return;
    }
    if (newPwd !== confirmPwd) {
      showModalMsg($passwordMsg, 'error', '两次输入的新密码不一致');
      return;
    }

    $btnChangePwd.disabled = true;
    $btnChangePwd.classList.add('loading');

    var xhr = new XMLHttpRequest();
    xhr.open('PUT', '/api/auth/password', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.onload = function () {
      $btnChangePwd.disabled = false;
      $btnChangePwd.classList.remove('loading');
      if (xhr.status === 401) { redirectToLogin(); return; }
      try {
        var resp = JSON.parse(xhr.responseText);
        if (resp.code === 200) {
          showModalMsg($passwordMsg, 'success', '密码修改成功');
          /* Clear password fields */
          $modalOldPwd.value = '';
          $modalNewPwd.value = '';
          $modalConfirmPwd.value = '';
        } else {
          showModalMsg($passwordMsg, 'error', resp.message || '修改失败');
        }
      } catch (e) {
        showModalMsg($passwordMsg, 'error', '数据解析失败');
      }
    };
    xhr.onerror = function () {
      $btnChangePwd.disabled = false;
      $btnChangePwd.classList.remove('loading');
      showModalMsg($passwordMsg, 'error', '网络请求失败');
    };
    xhr.send(JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd }));
  }

  /* ==================================================================
   *  Event Bindings for Modal
   * ================================================================== */

  /* Click profile trigger in navbar to open modal */
  if ($profileTrigger) {
    $profileTrigger.addEventListener('click', openProfileModal);
  }

  /* Close button */
  if ($modalCloseBtn) {
    $modalCloseBtn.addEventListener('click', closeProfileModal);
  }

  /* Click overlay (outside modal box) to close */
  if ($profileModal) {
    $profileModal.addEventListener('click', function (e) {
      if (e.target === $profileModal) {
        closeProfileModal();
      }
    });
  }

  /* Save profile button */
  if ($btnSaveProfile) {
    $btnSaveProfile.addEventListener('click', saveProfile);
  }

  /* Change password button */
  if ($btnChangePwd) {
    $btnChangePwd.addEventListener('click', changePassword);
  }

  /* Enter key support in password fields */
  if ($modalConfirmPwd) {
    $modalConfirmPwd.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { changePassword(); }
    });
  }

  /* ==================================================================
   *  Bootstrap
   * ================================================================== */

  /* Run on DOM-ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
  } else {
    initDashboard();
  }

})();
