import "./BottomNav.css";

export default function BottomNav({activeTab, onTabChange }){
    return (
        <nav className="bottom-nav">
        <button
          className={activeTab === "inicio" ? "nav-item active" : "nav-item"}
          onClick={() => onTabChange("inicio")}
        >
          <span>🏠</span>
          <span>Inicio</span>
        </button>
        <button
          className={
            activeTab === "directorio" ? "nav-item active" : "nav-item"
          }
          onClick={() => onTabChange("directorio")}
        >
          <span>📖</span>
          <span>Directorio</span>
        </button>
        <button
          className={activeTab === "favoritos" ? "nav-item active" : "nav-item"}
          onClick={() => onTabChange("favoritos")}
        >
          <span>⭐</span>
          <span>Favoritos</span>
        </button>
        <button
          className={activeTab === "perfil" ? "nav-item active" : "nav-item"}
          onClick={() => onTabChange("perfil")}
        >
          <span>👤</span>
          <span>Mi Perfil</span>
        </button>
      </nav>
    )
}