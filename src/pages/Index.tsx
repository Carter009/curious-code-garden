
import { Navigate } from 'react-router-dom';

const Index = () => {
  // This just redirects to the Dashboard, which is our main page
  return <Navigate to="/" replace />;
};

export default Index;
