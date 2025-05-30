import React from 'react';
import Picture from '../Picture/Picture';
import Display from '../Display/Display';
import Wolf from './Wolf';
import Globe from './Globe';

const Art = () => {
  
    return (
        <>
        {/* liam portrait */}
        <Picture 
            url={"assets/3D/Portrait/scene.gltf"}
            scale={[4, 4, 4]}
            position={[19.3, 7, 0]}            
            rotation={[0, -Math.PI, 0]}
            metalness={0.9}
            roughness={0.9}
            info="Liam Portresi: 2021, Tuval üzerine yağlı boya. Bu portre, sanatçının kardeşi Liam'ın karakteristik özelliklerini ve duygusal derinliğini yansıtmak için yapılmıştır. Fırça darbeleri ve renk geçişleriyle portreye canlılık katılmıştır. Boyut: 70x100 cm. Sergilendiği yer: Ana Salon."
        />
        <Display position={[20, 5, 0]} size={[1, 18, 11]} />
        {/* creation of adam */}
        <Picture 
            url={"assets/3D/Hands/scene.gltf"}
            scale={[0.1, 0.1, 0.1]}
            position={[34.7, 12, 12]}            
            rotation={[0, -Math.PI / 2, Math.PI]}
            metalness={0}
            roughness={0.9}
            info="Creation of Adam: 2020, Dijital çalışma. Michelangelo'nun ünlü freskinden esinlenerek yapılan bu dijital eser, insanın yaratılış anını modern bir bakış açısıyla yorumluyor. Yüksek çözünürlüklü dijital baskı olarak sergilenmektedir. Boyut: 120x60 cm."
        />

        {/* wedding */}
        <Picture 
            url={"assets/3D/Wedding/scene.gltf"}
            scale={[2.5, 2.5, 2.5]}
            position={[19.3, 7, 25]}            
            rotation={[Math.PI / 2, Math.PI, 0]}
            metalness={0.0}
            roughness={0.3}
            info="Wedding: 2019, Tuval üzerine akrilik. Bu eser, bir düğün anını soyut bir şekilde betimler. Renklerin ve formların dansı, izleyiciye neşe ve birliktelik duygusu aşılar. Boyut: 80x120 cm. Sergilendiği yer: Sağ Galeri."
        />
         <Display position={[20, 5, 25]} size={[1, 18, 11]} />

        {/* wilson portrait */}
         <Picture 
            url={"assets/3D/Wilson/scene.gltf"}
            scale={[2.5, 2.5, 2.5 ]}
            position={[-19.3, 7, 0]}            
            rotation={[-Math.PI / 2, 0, 0]}
            metalness={0}
            roughness={0.3}
            info="Wilson Portresi: 2022, Tuval üzerine yağlı boya. Sanatçının yakın arkadaşı Wilson'ın portresi, detaylı ışık-gölge çalışmaları ve gerçekçi dokusuyla dikkat çeker. Boyut: 60x90 cm. Sergilendiği yer: Sol Galeri."
        />
         <Display position={[-20, 5, 0]} size={[1, 18, 11]} />

        {/* old man portrait */}
        <Picture 
            url={"assets/3D/OldMan/scene.gltf"}
            scale={[4, 4, 4]}
            position={[-19.4, 7, 25]}            
            rotation={[0, 0, 0]}
            metalness={0.9}
            roughness={0.9}
            info="Yaşlı Adam Portresi: 2018, Tuval üzerine karışık teknik. Hayat tecrübesi ve yaşanmışlık izleri, portredeki detaylarda öne çıkar. Sanatçı, yaşlı adamın yüzündeki çizgilerle zamanın izlerini vurgulamıştır. Boyut: 90x120 cm."
        />
         <Display position={[-20, 5, 25]} size={[1, 18, 11]} />

         {/* girl portrait */}
         <Picture 
            url={"assets/3D/Girl/scene.gltf"}
            scale={[6.5, 6.5, 6.5]}
            position={[-34.6, 10, 12]}            
            rotation={[-Math.PI / 2, 0, 0]}
            metalness={0.7}
            roughness={0.8}
            info="Kız Portresi: 2023, Dijital çalışma. Renkli ve enerjik bir kompozisyonla gençliğin dinamizmi ve umudu yansıtılmıştır. Dijital fırça teknikleriyle oluşturulmuş, canlı renkler ve modern bir tarzda sunulmuştur. Boyut: 100x100 cm."
        />
        {/* Kurt Heykeli - Galeri Ortası */}
        <Wolf />
        {/* Dünya Hologramı - Kurtun üstünde, tam ortada */}
        <Globe />
    </>

    )
  }

  export default Art;