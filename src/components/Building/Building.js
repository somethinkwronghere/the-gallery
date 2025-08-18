import React from 'react';
import Wall from '../Wall/Wall';
import WindowFrame from '../WindowFrame/WindowFrame';
import Glass from '../Glass/Glass';

const Building = () => {
  
    return (
        <>
            <Wall 
                position={[0, 0, -13.5]}
                rotation={[0, 0, 0]}
                scale={[1, 1, 1]}
                modelUrl={"/assets/3D/Wall/scene.gltf"}
                mapUrl={"/assets/3D/Wall/Textures/White_Wall.jpg"}
                normalMapUrl={"/assets/3D/Wall/Textures/White_Wall_NORMAL.jpg"}
                info="Ana Duvar: Galeri yapısının temel duvarı"
            />

            {/* side windows */}
            <WindowFrame 
                scale={[0.008, 0.008, 0.008]}
                position={[6.5, 8.5, -15]}
                rotation={[0, Math.PI ,0]}
                modelUrl={"/assets/3D/WindowNoGlassL/scene.gltf"}
                mapUrl={"/assets/3D/WindowNoGlassL/Textures/Material_49_baseColor.png"}
                info="Sol Pencere Çerçevesi: Ahşap pencere çerçevesi"
            />
            <WindowFrame 
                scale={[0.008, 0.008, 0.008]}
                position={[-6.5, 8.5, -15]}
                rotation={[0, Math.PI ,0]}
                modelUrl={"/assets/3D/WindowNoGlassR/scene.gltf"}
                mapUrl={"/assets/3D/WindowNoGlassR/Textures/Material_49_baseColor.png"}
                info="Sağ Pencere Çerçevesi: Ahşap pencere çerçevesi"
            />
            <Glass            
                scale={[0.008, 0.008, 0.008]}
                position={[6.5, 8.5, -15]}
                rotation={[0, 0, 0]}
                modelUrl={"/assets/3D/WindowGlassL/scene.gltf"}
                info="Sol Pencere Camı: Şeffaf cam panel"
            />
            <Glass            
                scale={[0.008, 0.008, 0.008]}
                position={[-6.5, 8.5, -15]}
                rotation={[0, 0, 0]}
                modelUrl={"/assets/3D/WindowGlassR/scene.gltf"}
                info="Sağ Pencere Camı: Şeffaf cam panel"
            />

            {/* roof */}
            <WindowFrame 
                scale={[2.7, 2.7, 2.7]}
                position={[0, 27, 13.2]}
                rotation={[0, 0, 0]}
                modelUrl={"/assets/3D/RoofNoGlass/scene.gltf"}
                mapUrl={"/assets/3D/RoofNoGlass/Textures/Material_49_baseColor.png"}
                info="Çatı Çerçevesi: Metal çatı yapısı"
            />
            <Glass            
                scale={[2.7, 2.7, 2.7]}
                position={[0, 27, 13.2]}
                rotation={[0, 0, 0]}
                modelUrl={"/assets/3D/RoofGlass/scene.gltf"}
                info="Çatı Camı: Şeffaf çatı paneli"
            />
        </>
    )
  }

  export default Building;
