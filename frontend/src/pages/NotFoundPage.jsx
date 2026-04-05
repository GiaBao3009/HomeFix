import { Button } from 'antd';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const NotFoundPage = () => {
    const location = useLocation();
    const isRoleDenied = location.state?.reason === 'role';

    return (
        <section className="-mx-4 -my-8 min-h-[78vh] overflow-hidden bg-white px-4 py-10 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <div className="relative mx-auto flex min-h-[68vh] max-w-6xl items-center justify-center overflow-hidden rounded-[2rem] border border-slate-200 bg-white px-6 py-12 shadow-[0_30px_80px_rgba(15,23,42,0.08)] sm:px-10">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.12),_transparent_32%)]" />
                <div className="pointer-events-none absolute -left-16 top-16 h-40 w-40 rounded-full bg-sky-100 blur-3xl" />
                <div className="pointer-events-none absolute -right-12 bottom-10 h-44 w-44 rounded-full bg-amber-100 blur-3xl" />

                <div className="relative grid w-full items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
                            <ShieldAlert size={16} className="text-sky-600" />
                            {isRoleDenied ? 'Khong dung quyen truy cap' : 'Trang khong ton tai'}
                        </div>
                        <div className="space-y-4">
                            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-400">404</p>
                            <h1 className="max-w-xl text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl">
                                {isRoleDenied ? 'Ban vua cham vao khu vuc khong danh cho vai tro hien tai.' : 'Nguoi tho vua rut day dien cua trang nay roi.'}
                            </h1>
                            <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                                {isRoleDenied
                                    ? 'He thong da chan de tranh di nham luong. Ban co the quay lai dashboard hoac ve trang chu de tiep tuc dung dung quyen.'
                                    : 'Duong dan ban mo khong con hop le, co the link sai hoac trang da duoc doi cho. HomeFix se dua ban ve khu vuc an toan hon.'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link to="/">
                                <Button type="primary" size="large" className="!h-12 !rounded-xl !px-6">
                                    Ve trang chu
                                </Button>
                            </Link>
                            <Link to="/dashboard">
                                <Button size="large" className="!h-12 !rounded-xl !px-6">
                                    <ArrowLeft size={16} />
                                    Ve dashboard
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="relative flex min-h-[360px] items-center justify-center">
                        <div className="electric-scene relative h-[340px] w-full max-w-[420px]">
                            <div className="absolute left-6 top-24 h-2 w-28 rounded-full bg-slate-200" />
                            <div className="absolute left-[124px] top-[99px] h-[3px] w-24 bg-slate-300 electric-cable" />
                            <div className="absolute left-[216px] top-[86px] h-8 w-10 rounded-r-xl rounded-tl-md rounded-bl-md border-2 border-slate-800 bg-white shadow-sm">
                                <span className="absolute left-1.5 top-2 h-3 w-1 rounded-full bg-slate-800" />
                                <span className="absolute left-4.5 top-2 h-3 w-1 rounded-full bg-slate-800" />
                            </div>
                            <div className="absolute left-[250px] top-[84px] h-10 w-2 rounded-full bg-slate-800 electric-plug" />
                            <div className="absolute left-[260px] top-[92px] h-14 w-14 rounded-full bg-amber-100/70 blur-xl electric-spark" />

                            <div className="absolute bottom-4 left-1/2 h-6 w-56 -translate-x-1/2 rounded-[999px] bg-slate-200/80 blur-xl" />
                            <div className="absolute bottom-10 left-1/2 h-3 w-48 -translate-x-1/2 rounded-full bg-slate-200" />

                            <div className="absolute bottom-12 left-[172px] h-24 w-16 rounded-t-[1.8rem] rounded-b-[1.2rem] bg-sky-600 shadow-lg shadow-sky-100" />
                            <div className="absolute bottom-32 left-[180px] h-16 w-14 rounded-full bg-slate-900" />
                            <div className="absolute bottom-[144px] left-[150px] h-4 w-20 rounded-full bg-slate-900" />
                            <div className="absolute bottom-[152px] left-[136px] h-16 w-10 origin-bottom rotate-[25deg] rounded-full bg-sky-500 worker-arm" />
                            <div className="absolute bottom-[148px] left-[230px] h-14 w-10 origin-top-left -rotate-[12deg] rounded-full bg-sky-500" />
                            <div className="absolute bottom-[58px] left-[164px] h-20 w-8 origin-top rotate-[8deg] rounded-full bg-slate-900" />
                            <div className="absolute bottom-[58px] left-[204px] h-[88px] w-8 origin-top -rotate-[10deg] rounded-full bg-slate-900" />
                            <div className="absolute bottom-[190px] left-[120px] h-16 w-14 rounded-full border-[10px] border-amber-400 border-b-slate-900 border-l-amber-400 border-r-amber-400 border-t-amber-400" />
                            <div className="absolute bottom-[177px] left-[114px] h-5 w-[104px] rounded-full bg-amber-300" />
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .electric-cable {
                    transform-origin: left center;
                    animation: cableFloat 2.8s ease-in-out infinite;
                }

                .electric-plug {
                    transform-origin: left center;
                    animation: plugPull 2.8s ease-in-out infinite;
                }

                .electric-spark {
                    animation: sparkPulse 1.4s ease-in-out infinite;
                }

                .worker-arm {
                    animation: armPull 2.8s ease-in-out infinite;
                }

                @keyframes plugPull {
                    0%, 100% {
                        transform: translateX(0) rotate(0deg);
                    }
                    35% {
                        transform: translateX(10px) rotate(-5deg);
                    }
                    65% {
                        transform: translateX(18px) rotate(-8deg);
                    }
                }

                @keyframes cableFloat {
                    0%, 100% {
                        transform: scaleX(1) translateY(0);
                    }
                    50% {
                        transform: scaleX(0.92) translateY(-2px);
                    }
                }

                @keyframes sparkPulse {
                    0%, 100% {
                        opacity: 0.12;
                        transform: scale(0.85);
                    }
                    50% {
                        opacity: 0.5;
                        transform: scale(1.08);
                    }
                }

                @keyframes armPull {
                    0%, 100% {
                        transform: rotate(25deg);
                    }
                    50% {
                        transform: rotate(12deg);
                    }
                }
            `}</style>
        </section>
    );
};

export default NotFoundPage;
