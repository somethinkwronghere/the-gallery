import React from 'react';
import Bench from '../Bench/Bench';

const Furniture = () => {
  
    return (
        <>
            <Bench 
              scale={[0.11, 0.11, 0.11]}
              position={[0, 0, 3]}
              rotation={[0, 0, 0]}
              info="Ana Galeri Bankı: Ahşap malzemeden yapılmış, galeri ziyaretçileri için dinlenme alanı."
            />
            <Bench
              scale={[0.09, 0.09, 0.09]}
              position={[0, 1.5, 21.5]}
              rotation={[0, 0, 0]}
              info="Küçük Bank: Kompakt tasarım, küçük galeri alanları için uygun."
            />
        </>
    );
}

export default Furniture;
