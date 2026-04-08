const GoogleIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
        />
        <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
        />
        <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
        />
        <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
        />
    </svg>
);

const GitHubIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.38 7.86 10.9.58.11.79-.25.79-.56 0-.28-.01-1.2-.02-2.17-3.2.69-3.88-1.36-3.88-1.36-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.25 3.33.96.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.19-1.49 3.16-1.18 3.16-1.18.63 1.58.24 2.75.12 3.04.73.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.25 5.67.41.36.77 1.06.77 2.14 0 1.55-.01 2.79-.01 3.18 0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
);

const providers = [
    {
        id: 'google',
        label: 'Đăng nhập với Google',
        subtitle: 'Dùng Gmail để vào nhanh',
        icon: <GoogleIcon />,
        iconClassName: 'bg-slate-50 text-slate-700 ring-1 ring-slate-200',
    },
    {
        id: 'github',
        label: 'Đăng nhập với GitHub',
        subtitle: 'Hợp với tài khoản kỹ thuật',
        icon: <GitHubIcon />,
        iconClassName: 'bg-slate-900 text-white shadow-sm',
    },
];

const AuthProviderButtons = ({ className = '' }) => {
    return (
        <div className={`flex flex-col gap-3 ${className}`.trim()}>
            {providers.map((provider) => (
                <button
                    key={provider.id}
                    type="button"
                    data-testid={`login-social-${provider.id}`}
                    className="group flex min-h-[72px] w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    onClick={() => {
                        window.location.href = `/oauth2/authorization/${provider.id}`;
                    }}
                >
                    <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105 ${provider.iconClassName}`}
                    >
                        {provider.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-800">{provider.label}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">{provider.subtitle}</span>
                    </span>
                </button>
            ))}
        </div>
    );
};

export default AuthProviderButtons;
