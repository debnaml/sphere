export default function PageHeading({ children, className = '' }) {
  const baseClasses = 'text-2xl font-bold text-gray-900';
  const merged = className ? `${baseClasses} ${className}` : baseClasses;
  return <h1 className={merged}>{children}</h1>;
}
