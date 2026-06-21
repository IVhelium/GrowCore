

export default function Container({ 
    children, 
    className = "" 
}) {
    return (
        <div className={`mx-auto min-w-0 w-full max-w-7xl px-4 lg:px-6 ${className}`}>
            {children}
        </div>
    );
}
