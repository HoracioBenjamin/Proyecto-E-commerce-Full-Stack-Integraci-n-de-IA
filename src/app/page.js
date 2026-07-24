// page.js
import ProductExplorer from '../components/CategoryHeader';
import CategoryGrid from '../components/CategoryGrid';
import ProductSelection from '../components/CategoryProductSelection';
import Marque from '../components/marque';
import RevistaSection from '../components/CategoryRevistaSection';
import GucciStyleGrid from '../components/CategoryMain';
import SobreNosotros from '../components/Nosotros';

import AiAssistant from '../components/IA/AiAssistant';

export default function Home() {
  return (
    <>
      <ProductExplorer />
      <CategoryGrid />

      <Marque />
      <GucciStyleGrid />

      <ProductSelection />

      <RevistaSection />
      <AiAssistant />
      <SobreNosotros />
    </>
  );
}