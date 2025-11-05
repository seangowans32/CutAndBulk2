import AOS from 'aos';
import 'aos/dist/aos.css';
import { useEffect } from 'react';
import BodyCalculator from './BodyCalculator.jsx';

export default function Home() {

  // AOS Animations
  useEffect(() => {
    AOS.init();
  }, []);

  return(
    <>
      <div className="App">
        <div className="App-body">
          <div className='container' data-aos="zoom-in-up">
            <BodyCalculator />
          </div>
        </div>
      </div>
    </>
  );
}