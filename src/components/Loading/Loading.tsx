import React, { useEffect } from 'react';
import UnifiedLoading, { setupThreeJSIntegration } from './UnifiedLoading';

// Legacy Loading component - now uses UnifiedLoading internally
const Loading: React.FC = () => {
  useEffect(() => {
    // Set up THREE.js integration with unified loading system
    setupThreeJSIntegration();
  }, []);

  // Return the unified loading component with legacy-compatible styling
  return (
    <UnifiedLoading 
      showGlobalProgress={true}
      showIndividualItems={false}
      showMessages={false}
      autoHide={true}
      hideDelay={500}
      className="legacy-loading"
    />
  );
};

export default Loading;