import React from 'react';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Kỳ Đài Conic - Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || String(this.state.error || 'Lỗi không xác định');
      const errorStack = this.state.error?.stack || this.state.errorInfo?.componentStack || '';

      return (
        <div className="min-h-screen bg-[#07090e] text-gray-100 flex items-center justify-center p-6 select-none font-sans">
          <div className="max-w-xl w-full bg-gradient-to-b from-[#181c28] via-[#12141d] to-[#0c0e14] border-2 border-red-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9)] space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)] flex-shrink-0">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-amber-200 to-amber-400 uppercase tracking-wide">
                  Đã Xảy Ra Lỗi Khởi Chạy
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Ứng dụng đã bảo vệ trạng thái an toàn để không bị treo.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#090b10] border border-gray-800 text-xs font-mono space-y-2 overflow-auto max-h-48 text-red-300">
              <div className="font-bold text-red-400">{errorMsg}</div>
              {errorStack && (
                <div className="text-[10.5px] text-gray-500 whitespace-pre-wrap opacity-80">
                  {errorStack}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Tải Lại Ứng Dụng</span>
              </button>

              <button
                onClick={this.handleResetCache}
                className="py-2.5 px-4 rounded-xl bg-[#1f2535] hover:bg-red-950/50 text-gray-300 hover:text-red-300 border border-gray-700 hover:border-red-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                title="Xóa bộ nhớ đệm cache và mở lại mặc định"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa Cache & Reset</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
