// components/SolicitorProfileBar.js
export default function SolicitorProfileBar({ name, position }) {
    const profileImage = `/images/solicitors/${name
      .toLowerCase()
      .replace(/\s+/g, '_')}.jpg`;
  
    return (
      <div className="flex items-center justify-between gap-4">
        {/* Left: Name & Position */}
        <div className="flex-1">
          <h1 className="text-xl sm:text-3xl font-bold">{name}</h1>
          {position && (
            <p className="text-gray-500 text-sm sm:text-base">{position}</p>
          )}
        </div>
  
        {/* Right: Profile Image */}
        <div className="relative">
          <img
            src={profileImage}
            alt={name}
            className="w-16 h-16 sm:w-24 sm:h-24 rounded-full object-cover shadow-md transition-transform duration-300 hover:scale-105 hover:shadow-lg"
            onError={(e) => {
              e.currentTarget.src = '/images/solicitors/default.jpg';
            }}
          />
        </div>
      </div>
    );
  }