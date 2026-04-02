import { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import './Admin.css';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Tooltip, Legend, Filler
);

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/admin/dashboard'),
      axiosInstance.get('/admin/revenue'),
      axiosInstance.get('/admin/reports'),
    ]).then(([statsRes, revRes, reportRes]) => {
      setStats(statsRes.data);
      setRevenue(revRes.data);
      setReport(reportRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminLayout title="📊 Tổng quan" subtitle="Dashboard quản trị hệ thống">
        <div className="admin-loading">⏳ Đang tải thống kê...</div>
      </AdminLayout>
    );
  }

  const statCards = [
    { icon: '📅', value: stats?.totalEvents ?? 0, label: 'Tổng sự kiện' },
    { icon: '✅', value: stats?.publishedEvents ?? 0, label: 'Đã xuất bản' },
    { icon: '👥', value: stats?.totalUsers ?? 0, label: 'Người dùng' },
    { icon: '🎟️', value: stats?.totalRegistrations ?? 0, label: 'Lượt đăng ký' },
  ];

  // Chart: Events by month
  const monthLabels = report?.eventsByMonth ? Object.keys(report.eventsByMonth) : [];
  const monthData = report?.eventsByMonth ? Object.values(report.eventsByMonth) : [];

  const barChartData = {
    labels: monthLabels,
    datasets: [{
      label: 'Sự kiện',
      data: monthData,
      backgroundColor: 'rgba(233, 69, 96, 0.6)',
      borderColor: '#e94560',
      borderWidth: 2,
      borderRadius: 6,
      borderSkipped: false,
    }]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a2e',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#fff',
        bodyColor: 'rgba(255,255,255,0.8)',
        padding: 10,
        cornerRadius: 8,
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 } }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 }, stepSize: 1 },
        beginAtZero: true,
      }
    }
  };

  // Chart: Users by role (Doughnut)
  const roleLabels = report?.usersByRole ? Object.keys(report.usersByRole) : [];
  const roleData = report?.usersByRole ? Object.values(report.usersByRole) : [];
  const roleColors = ['#e94560', '#a855f7', '#3b82f6'];

  const doughnutData = {
    labels: roleLabels,
    datasets: [{
      data: roleData,
      backgroundColor: roleColors.map(c => c + '99'),
      borderColor: roleColors,
      borderWidth: 2,
      hoverOffset: 8,
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'rgba(255,255,255,0.7)',
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10,
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: '#1a1a2e',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#fff',
        bodyColor: 'rgba(255,255,255,0.8)',
        padding: 10,
        cornerRadius: 8,
      }
    },
    cutout: '65%',
  };

  // Chart: Revenue line
  const revenueByEvent = revenue?.revenueByEvent || [];
  const lineData = {
    labels: revenueByEvent.slice(0, 8).map(e => e.eventTitle?.substring(0, 15) + '...' || 'N/A'),
    datasets: [{
      label: 'Doanh thu (VNĐ)',
      data: revenueByEvent.slice(0, 8).map(e => e.revenue || 0),
      borderColor: '#e94560',
      backgroundColor: 'rgba(233, 69, 96, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#e94560',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
    }]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1a2e',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#fff',
        bodyColor: 'rgba(255,255,255,0.8)',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => `${ctx.parsed.y?.toLocaleString('vi-VN')}đ`
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: 'rgba(255,255,255,0.4)',
          font: { size: 11 },
          callback: (v) => v >= 1000 ? (v / 1000) + 'k' : v
        },
        beginAtZero: true,
      }
    }
  };

  return (
    <AdminLayout title="📊 Tổng quan" subtitle="Dashboard quản trị hệ thống">
      {/* Stat Cards */}
      <div className="admin-stats-grid">
        {statCards.map((card, i) => (
          <div key={i} className="admin-stat-card">
            <div className="admin-stat-info">
              <div className="admin-stat-value">{card.value.toLocaleString('vi-VN')}</div>
              <div className="admin-stat-label">{card.label}</div>
            </div>
            <div className="admin-stat-icon">{card.icon}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="admin-charts-grid">
        <div className="admin-chart-card">
          <h3>📊 Sự kiện theo tháng</h3>
          <div style={{ height: 260 }}>
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>
        <div className="admin-chart-card">
          <h3>👥 Người dùng theo vai trò</h3>
          <div style={{ height: 260 }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="admin-charts-grid">
        <div className="admin-chart-card" style={{ gridColumn: '1 / -1' }}>
          <h3>💰 Doanh thu theo sự kiện</h3>
          <div style={{ height: 260 }}>
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>
      </div>

      {/* Top 5 Events */}
      {stats?.top5Events?.length > 0 && (
        <div className="admin-table-card">
          <div className="admin-table-header">
            <h3>🔥 Top 5 sự kiện đông nhất</h3>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tên sự kiện</th>
                <th>Địa điểm</th>
                <th>Số tham dự</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {stats.top5Events.map((e, i) => (
                <tr key={e.id}>
                  <td style={{ fontWeight: 700, color: 'var(--admin-primary)' }}>{i + 1}</td>
                  <td><strong style={{ color: '#fff' }}>{e.title}</strong></td>
                  <td>{e.location}</td>
                  <td style={{ fontWeight: 600 }}>{e.currentAttendees}</td>
                  <td>
                    <span className={`admin-status-badge ${e.status?.toLowerCase()}`}>
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent Events */}
      {report?.recentEvents?.length > 0 && (
        <div className="admin-table-card">
          <div className="admin-table-header">
            <h3>📋 Sự kiện gần đây</h3>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Người tạo</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                <th>Tham dự</th>
              </tr>
            </thead>
            <tbody>
              {report.recentEvents.map(e => (
                <tr key={e.id}>
                  <td><strong style={{ color: '#fff' }}>{e.title}</strong></td>
                  <td>{e.organizerName}</td>
                  <td>{e.createdAt ? new Date(e.createdAt).toLocaleDateString('vi-VN') : '—'}</td>
                  <td>
                    <span className={`admin-status-badge ${e.status?.toLowerCase()}`}>
                      {e.status}
                    </span>
                  </td>
                  <td>{e.currentAttendees} / {e.maxCapacity || '∞'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
