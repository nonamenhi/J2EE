import { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import './Admin.css';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Tooltip, Legend, Filler
);

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview'); // overview | revenue

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/admin/reports'),
      axiosInstance.get('/admin/revenue'),
    ]).then(([reportRes, revRes]) => {
      setReport(reportRes.data);
      setRevenue(revRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminLayout title="📈 Báo cáo & Thống kê" subtitle="Phân tích dữ liệu hệ thống">
        <div className="admin-loading">⏳ Đang tải dữ liệu báo cáo...</div>
      </AdminLayout>
    );
  }

  // Events by status (Doughnut)
  const statusLabels = report?.eventsByStatus ? Object.keys(report.eventsByStatus) : [];
  const statusData = report?.eventsByStatus ? Object.values(report.eventsByStatus) : [];
  const statusColors = ['#fde047', '#86efac', '#fca5a5']; // DRAFT, PUBLISHED, CANCELLED

  const statusDoughnut = {
    labels: statusLabels,
    datasets: [{
      data: statusData,
      backgroundColor: statusColors.map(c => c + '80'),
      borderColor: statusColors,
      borderWidth: 2,
      hoverOffset: 8,
    }]
  };

  // Events by month (Bar)
  const monthLabels = report?.eventsByMonth ? Object.keys(report.eventsByMonth) : [];
  const monthData = report?.eventsByMonth ? Object.values(report.eventsByMonth) : [];

  const monthBar = {
    labels: monthLabels,
    datasets: [{
      label: 'Sự kiện tạo mới',
      data: monthData,
      backgroundColor: 'rgba(233, 69, 96, 0.5)',
      borderColor: '#e94560',
      borderWidth: 2,
      borderRadius: 6,
      borderSkipped: false,
    }]
  };

  // Revenue by event (Bar)
  const revenueByEvent = revenue?.revenueByEvent || [];
  const revenueBar = {
    labels: revenueByEvent.slice(0, 10).map(e => e.eventTitle?.substring(0, 20) || 'N/A'),
    datasets: [{
      label: 'Doanh thu (VNĐ)',
      data: revenueByEvent.slice(0, 10).map(e => e.revenue || 0),
      backgroundColor: 'rgba(168, 85, 247, 0.5)',
      borderColor: '#a855f7',
      borderWidth: 2,
      borderRadius: 6,
      borderSkipped: false,
    }]
  };

  const chartOpts = (unit = '') => ({
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
        callbacks: unit === 'vnd' ? {
          label: (ctx) => `${ctx.parsed.y?.toLocaleString('vi-VN')}đ`
        } : undefined,
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } } },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: 'rgba(255,255,255,0.4)', font: { size: 11 }, stepSize: 1,
          ...(unit === 'vnd' ? { callback: (v) => v >= 1000000 ? (v / 1000000) + 'M' : v >= 1000 ? (v / 1000) + 'k' : v } : {})
        },
        beginAtZero: true,
      }
    }
  });

  const doughnutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: 'rgba(255,255,255,0.7)', padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { size: 12 } }
      },
      tooltip: {
        backgroundColor: '#1a1a2e', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
        titleColor: '#fff', bodyColor: 'rgba(255,255,255,0.8)', padding: 10, cornerRadius: 8,
      }
    },
    cutout: '65%',
  };

  const tabStyle = (key) => ({
    padding: '0.5rem 1.25rem',
    borderRadius: '10px',
    border: `1px solid ${tab === key ? 'var(--admin-primary)' : 'var(--admin-border)'}`,
    background: tab === key ? 'rgba(233,69,96,0.15)' : 'transparent',
    color: tab === key ? 'var(--admin-primary-light)' : 'var(--admin-text-muted)',
    cursor: 'pointer',
    fontWeight: tab === key ? 700 : 400,
    transition: 'all 0.2s',
    fontSize: '0.88rem',
  });

  const totalTicketsSold = revenueByEvent.reduce((s, e) => s + (e.ticketsSold || 0), 0);
  const totalRevenue = revenue?.totalRevenue ?? 0;

  return (
    <AdminLayout title="📈 Báo cáo & Thống kê" subtitle="Phân tích dữ liệu hệ thống">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button style={tabStyle('overview')} onClick={() => setTab('overview')}>📊 Tổng quan sự kiện</button>
        <button style={tabStyle('revenue')} onClick={() => setTab('revenue')}>💰 Doanh thu</button>
      </div>

      {tab === 'overview' && (
        <>
          {/* Summary stats */}
          <div className="admin-stats-grid" style={{ marginBottom: '2rem' }}>
            {statusLabels.map((label, i) => (
              <div key={label} className="admin-stat-card">
                <div className="admin-stat-info">
                  <div className="admin-stat-value">{statusData[i]}</div>
                  <div className="admin-stat-label">{label}</div>
                </div>
                <div className="admin-stat-icon">
                  {label === 'PUBLISHED' ? '✅' : label === 'DRAFT' ? '📝' : '❌'}
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="admin-charts-grid">
            <div className="admin-chart-card">
              <h3>📊 Sự kiện theo tháng (12 tháng gần nhất)</h3>
              <div style={{ height: 280 }}>
                <Bar data={monthBar} options={chartOpts()} />
              </div>
            </div>
            <div className="admin-chart-card">
              <h3>📋 Sự kiện theo trạng thái</h3>
              <div style={{ height: 280 }}>
                <Doughnut data={statusDoughnut} options={doughnutOpts} />
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'revenue' && (
        <>
          {/* Revenue summary */}
          <div className="admin-stats-grid" style={{ marginBottom: '2rem' }}>
            <div className="admin-stat-card">
              <div className="admin-stat-info">
                <div className="admin-stat-value" style={{ fontSize: '1.5rem' }}>
                  {totalRevenue.toLocaleString('vi-VN')}đ
                </div>
                <div className="admin-stat-label">Tổng doanh thu</div>
              </div>
              <div className="admin-stat-icon">💰</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-info">
                <div className="admin-stat-value">{totalTicketsSold}</div>
                <div className="admin-stat-label">Tổng vé đã bán</div>
              </div>
              <div className="admin-stat-icon">🎫</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-info">
                <div className="admin-stat-value">{revenueByEvent.length}</div>
                <div className="admin-stat-label">Sự kiện có doanh thu</div>
              </div>
              <div className="admin-stat-icon">📋</div>
            </div>
          </div>

          {/* Revenue chart */}
          {revenueByEvent.length > 0 && (
            <div className="admin-chart-card" style={{ marginBottom: '2rem' }}>
              <h3>📊 Doanh thu theo sự kiện</h3>
              <div style={{ height: 300 }}>
                <Bar data={revenueBar} options={chartOpts('vnd')} />
              </div>
            </div>
          )}

          {/* Revenue table */}
          {revenueByEvent.length > 0 ? (
            <div className="admin-table-card">
              <div className="admin-table-header">
                <h3>📋 Chi tiết doanh thu</h3>
                <button
                  className="admin-btn admin-btn-info"
                  onClick={() => alert('🚀 Tính năng xuất báo cáo sắp ra mắt!')}
                >
                  📥 Xuất báo cáo
                </button>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Sự kiện</th>
                    <th>Vé đã bán</th>
                    <th>Số đơn</th>
                    <th>Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueByEvent.map((ev, i) => (
                    <tr key={ev.eventId}>
                      <td style={{ fontWeight: 700, color: 'var(--admin-primary)' }}>{i + 1}</td>
                      <td><strong style={{ color: '#fff' }}>{ev.eventTitle}</strong></td>
                      <td>{ev.ticketsSold}</td>
                      <td>{ev.bookingCount}</td>
                      <td>
                        <span style={{ color: '#a78bfa', fontWeight: 700 }}>
                          {ev.revenue?.toLocaleString('vi-VN')}đ
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-empty-state">💸 Chưa có doanh thu nào</div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
