import whatsappLogo from '../../assets/pngimg.com - whatsapp_PNG6.png';

export const LeftPanel = () => (
    <div className="hidden md:flex md:w-1/2 flex-col relative p-12 border-r border-[#eef1f2] bg-white h-full">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-[#f3fbf7] pointer-events-none" />
        <div className="relative flex flex-col gap-10 h-full">
            <div className="flex items-center gap-5">
                <div className="h-[120px] w-[120px] rounded-[30px] bg-[#d9f4ec] flex items-center justify-center shadow-inner">
                    <img src={whatsappLogo} alt="WhatsApp" className="h-24 w-24 object-contain" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-[#00a884] uppercase tracking-[0.3em]">Chào mừng trở lại</p>
                    <h1 className="text-3xl font-semibold text-[#0f172a] leading-snug">
                        Tiếp tục cuộc trò chuyện của bạn
                    </h1>
                </div>
            </div>

            <div className="bg-[#e6f6f1] border border-[#caeee0] rounded-3xl p-6 space-y-3 text-[#0f3d32] shadow-[0_18px_35px_rgba(0,168,132,0.08)]">
                <p className="text-lg font-semibold">Đăng nhập nhanh, bảo mật cao</p>
                <p className="text-sm leading-relaxed">
                    Hãy quay lại với nhóm chat, danh sách broadcast và kênh thông báo của bạn trong vài giây—
                    mọi dữ liệu đã được mã hóa và đồng bộ liền mạch.
                </p>
                <ul className="space-y-2 text-sm">
                    {[
                        'Tự động nhớ thiết bị đáng tin cậy',
                        'Thông báo push realtime',
                        'Chế độ tối chỉ với một lần chạm'
                    ].map(item => (
                        <li key={item} className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[#00a884]" />
                            {item}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="text-xs uppercase tracking-[0.5em] text-[#6c7c7a]">
                Trusted • Seamless • Secure
            </div>
        </div>
    </div>
);