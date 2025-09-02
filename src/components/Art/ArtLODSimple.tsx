import React from 'react'
import Picture from '../Picture/Picture'
import Display from '../Display/Display'
import Wolf from './Wolf'


/**
 * Basit LOD destekli Art bileşeni
 * LOD sistemi backend'de çalışıyor, frontend'de standart bileşenler kullanılıyor
 */
const ArtLODSimple: React.FC = () => {
  return (
    <>
      {/* Liam portrait */}
      <Picture 
        url="assets/3D/Portrait/scene.gltf"
        scale={[4, 4, 4]}
        position={[19.3, 7, 0]}            
        rotation={[0, -Math.PI, 0]}
        metalness={0.9}
        roughness={0.9}
        info="Liam Portresi: 2021, Tuval üzerine yağlı boya. Bu portre, sanatçının kardeşi Liam'ın karakteristik özelliklerini ve duygusal derinliğini yansıtmak için yapılmıştır. Fırça darbeleri ve renk geçişleriyle portreye canlılık katılmıştır. Boyut: 70x100 cm. Sergilendiği yer: Ana Salon."
      />
      <Display position={[20, 5, 0]} size={[1, 18, 11]} />

      {/* Creation of Adam */}
      <Picture 
        url="assets/3D/Hands/scene.gltf"
        scale={[0.1, 0.1, 0.1]}
        position={[34.7, 12, 12]}            
        rotation={[0, -Math.PI / 2, Math.PI]}
        metalness={0}
        roughness={0.9}
        info="Creation of Adam: 2020, Dijital çalışma. Michelangelo'nun ünlü freskinden esinlenerek yapılan bu dijital eser, insanın yaratılış anını modern bir bakış açısıyla yorumluyor. Yüksek çözünürlüklü dijital baskı olarak sergilenmektedir. Boyut: 120x60 cm."
      />

      {/* Wedding */}
      <Picture 
        url="assets/3D/Wedding/scene.gltf"
        scale={[2.5, 2.5, 2.5]}
        position={[19.3, 7, 25]}            
        rotation={[Math.PI / 2, Math.PI, 0]}
        metalness={0.0}
        roughness={0.3}
        info="Wedding: 2019, Tuval üzerine akrilik. Bu eser, bir düğün anını soyut bir şekilde betimler. Renklerin ve formların dansı, izleyiciye neşe ve birliktelik duygusu aşılar. Boyut: 80x120 cm. Sergilendiği yer: Sağ Galeri."
      />
      <Display position={[20, 5, 25]} size={[1, 18, 11]} />

      {/* Wilson portrait */}
      <Picture 
        url="assets/3D/Wilson/scene.gltf"
        scale={[2.5, 2.5, 2.5]}
        position={[-19.3, 7, 0]}            
        rotation={[-Math.PI / 2, 0, 0]}
        metalness={0}
        roughness={0.3}
        info="Wilson Portresi: 2022, Tuval üzerine yağlı boya. Sanatçının yakın arkadaşı Wilson'ın portresi, detaylı ışık-gölge çalışmaları ve gerçekçi dokusuyla dikkat çeker. Boyut: 60x90 cm. Sergilendiği yer: Sol Galeri."
      />
      <Display position={[-20, 5, 0]} size={[1, 18, 11]} />

      {/* Old man portrait */}
      <Picture 
        url="assets/3D/OldMan/scene.gltf"
        scale={[4, 4, 4]}
        position={[-19.4, 7, 25]}            
        rotation={[0, 0, 0]}
        metalness={0.9}
        roughness={0.9}
        info="Kasımpatılı Natürmort: 1929, Sunta üzerine yağlı boya. Ali Sami Yetik'in bu eserinde, lacivert vazo ve cam kaseye yerleştirilmiş pembe, sarı, beyaz çiçekler ile dökülen yapraklar canlı renklerle ve izlenimci fırça darbeleriyle resmedilmiştir. Arka plan düz fon, imza sol üstte. Boyut: 123x97 cm (çerçeveli). Sergilendiği yer: Ankara RHM."
      />
      <Display position={[-20, 5, 25]} size={[1, 18, 11]} />

      {/* Girl portrait */}
      <Picture 
        url="assets/3D/Girl/scene.gltf"
        scale={[6.5, 6.5, 6.5]}
        position={[-34.6, 10, 12]}            
        rotation={[-Math.PI / 2, 0, 0]}
        metalness={0.7}
        roughness={0.8}
        info="Kız Portresi: 2023, Dijital çalışma. Renkli ve enerjik bir kompozisyonla gençliğin dinamizmi ve umudu yansıtılmıştır. Dijital fırça teknikleriyle oluşturulmuş, canlı renkler ve modern bir tarzda sunulmuştur. Boyut: 100x100 cm."
      />

      {/* Wolf Sculpture - Center of gallery (enlarged and facing forward) */}
      <Wolf 
        info="Werewolf Warrior: Fantastik heykel. Orta salon sergisi. Malzeme: Dijital/3B model."
        scale={[1.2, 1.2, 1.2]}
        position={[0, 0, 8]}
        rotation={[0, 0, 0]}
      />


    </>
  )
}

export default ArtLODSimple