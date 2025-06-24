import React from 'react';
import PropTypes from 'prop-types';

export function ChickenChaseLoader({ isVisible = true, message = "Loading..." }) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-50">
      {/* Loading Message */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{message}</h2>
        <p className="text-gray-600">Our chef is trying to catch dinner!</p>
      </div>

      {/* Animation Container */}
      <div className="relative w-full max-w-md h-32 overflow-hidden bg-blue-50 rounded-lg border-2 border-blue-200">
        {/* Ground */}
        <div className="absolute bottom-0 w-full h-4 bg-green-300"></div>
        
        {/* Clouds */}
        <div className="absolute top-2 left-4 w-8 h-4 bg-white rounded-full opacity-70"></div>
        <div className="absolute top-4 right-8 w-6 h-3 bg-white rounded-full opacity-70"></div>
        <div className="absolute top-3 left-1/2 w-10 h-5 bg-white rounded-full opacity-70"></div>

        {/* Realistic Chicken (running across screen) */}
        <div className="absolute bottom-4 chicken-runner">
          <div className="relative">
            {/* Realistic Chicken Body - more oval and proportioned */}
            <div className="w-10 h-8 bg-gradient-to-b from-white to-gray-100 rounded-full relative shadow-lg border border-gray-300">
              {/* Realistic Chicken Head - smaller, more proportioned */}
              <div className="absolute -top-4 left-2.5 w-6 h-6 bg-gradient-to-b from-white to-gray-50 rounded-full shadow-md border border-gray-300">
                {/* Realistic Beak - more pointed and natural */}
                <div className="absolute top-3 left-6 w-3 h-1.5 bg-gradient-to-r from-yellow-600 to-orange-500 rounded-r-full shadow-sm"></div>
                <div className="absolute top-3.5 left-6 w-2 h-0.5 bg-orange-600 rounded-r-full"></div>
                
                {/* Realistic Eyes - more detailed */}
                <div className="absolute top-1.5 left-1.5 w-2 h-2 bg-white rounded-full border-2 border-gray-400 shadow-sm">
                  <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-black rounded-full"></div>
                  <div className="absolute top-0.5 left-1 w-0.5 h-0.5 bg-white rounded-full"></div>
                  <div className="absolute top-0 left-0.5 w-1 h-0.5 bg-gray-200 rounded-t-full"></div>
                </div>
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-white rounded-full border-2 border-gray-400 shadow-sm">
                  <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-black rounded-full"></div>
                  <div className="absolute top-0.5 right-1 w-0.5 h-0.5 bg-white rounded-full"></div>
                  <div className="absolute top-0 right-0.5 w-1 h-0.5 bg-gray-200 rounded-t-full"></div>
                </div>
                
                {/* Realistic Comb - more natural texture */}
                <div className="absolute -top-3 left-1.5 w-3 h-4 realistic-comb">
                  <div className="absolute top-0 left-0 w-1 h-3 bg-gradient-to-t from-red-600 to-red-400 rounded-t-full shadow-sm"></div>
                  <div className="absolute top-0 left-0.5 w-1.5 h-4 bg-gradient-to-t from-red-600 to-red-400 rounded-t-full shadow-sm"></div>
                  <div className="absolute top-0 left-1.5 w-1 h-3 bg-gradient-to-t from-red-600 to-red-400 rounded-t-full shadow-sm"></div>
                </div>
                
                {/* Realistic Wattles */}
                <div className="absolute top-4 left-2 w-1.5 h-2 bg-gradient-to-b from-red-400 to-red-600 rounded-full shadow-sm wattle-1"></div>
                <div className="absolute top-4 left-3.5 w-1.5 h-2 bg-gradient-to-b from-red-400 to-red-600 rounded-full shadow-sm wattle-2"></div>
              </div>
              
              {/* Realistic Wings with detailed feathers */}
              <div className="absolute top-1 right-0.5 w-5 h-4 realistic-wing wing-flap">
                <div className="absolute top-0 right-0 w-2 h-3 bg-gradient-to-br from-amber-100 to-amber-300 rounded-lg shadow-sm border border-amber-400">
                  {/* Primary feathers */}
                  <div className="absolute top-0 right-0 w-0.5 h-2.5 bg-amber-600 rounded-r-full"></div>
                  <div className="absolute top-0.5 right-0.5 w-0.5 h-2 bg-amber-500 rounded-r-full"></div>
                  <div className="absolute top-1 right-1 w-0.5 h-1.5 bg-amber-400 rounded-r-full"></div>
                </div>
                <div className="absolute top-1 right-1.5 w-2 h-2 bg-gradient-to-br from-white to-amber-200 rounded-lg shadow-sm">
                  {/* Secondary feathers */}
                  <div className="absolute top-0 right-0 w-0.5 h-1.5 bg-amber-300 rounded-r-full"></div>
                  <div className="absolute top-0.5 right-0.5 w-0.5 h-1 bg-amber-200 rounded-r-full"></div>
                </div>
              </div>
              
              {/* Realistic Tail feathers - more detailed and natural */}
              <div className="absolute top-0 -right-4 w-5 h-6 tail-feathers">
                <div className="absolute top-0 right-0 w-2 h-5 bg-gradient-to-br from-amber-200 to-amber-500 rounded-r-full shadow-sm tail-feather-1 border border-amber-600"></div>
                <div className="absolute top-1 right-1 w-2 h-4 bg-gradient-to-br from-amber-300 to-amber-600 rounded-r-full shadow-sm tail-feather-2 border border-amber-700"></div>
                <div className="absolute top-2 right-2 w-1.5 h-3 bg-gradient-to-br from-amber-400 to-amber-700 rounded-r-full shadow-sm tail-feather-3 border border-amber-800"></div>
                <div className="absolute top-2.5 right-2.5 w-1 h-2 bg-gradient-to-br from-amber-500 to-amber-800 rounded-r-full shadow-sm"></div>
              </div>
              
              {/* Realistic Body texture and markings */}
              <div className="absolute top-1 left-1 w-3 h-2 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full opacity-40"></div>
              <div className="absolute top-3 left-2 w-2 h-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full opacity-30"></div>
              <div className="absolute top-4 left-3 w-2 h-1 bg-gradient-to-r from-amber-100 to-amber-200 rounded-full opacity-50"></div>
              
              {/* Breast feathers */}
              <div className="absolute top-2 left-0 w-4 h-3 bg-gradient-to-b from-white to-gray-100 rounded-full opacity-60 border border-gray-200"></div>
            </div>
            
            {/* Realistic Legs with proper chicken anatomy */}
            <div className="absolute -bottom-1 left-4 legs-running">
              <div className="w-2 h-4 bg-gradient-to-b from-yellow-600 to-yellow-700 rounded-b leg-1 border border-yellow-800 shadow-sm">
                {/* Knee joint */}
                <div className="absolute top-2 left-0 w-2 h-1 bg-yellow-700 rounded-full"></div>
                {/* Realistic chicken foot with toes */}
                <div className="absolute -bottom-1 -left-1 w-4 h-2 chicken-foot-1">
                  <div className="absolute bottom-0 left-0 w-1 h-1.5 bg-yellow-700 rounded-b-full"></div>
                  <div className="absolute bottom-0 left-1 w-1 h-1.5 bg-yellow-700 rounded-b-full"></div>
                  <div className="absolute bottom-0 left-2 w-1 h-1.5 bg-yellow-700 rounded-b-full"></div>
                  <div className="absolute bottom-0 left-3 w-0.5 h-1 bg-yellow-700 rounded-b-full"></div>
                  {/* Claws */}
                  <div className="absolute -bottom-0.5 left-0 w-0.5 h-0.5 bg-gray-600 rounded-b-full"></div>
                  <div className="absolute -bottom-0.5 left-1 w-0.5 h-0.5 bg-gray-600 rounded-b-full"></div>
                  <div className="absolute -bottom-0.5 left-2 w-0.5 h-0.5 bg-gray-600 rounded-b-full"></div>
                  <div className="absolute -bottom-0.5 left-3 w-0.5 h-0.5 bg-gray-600 rounded-b-full"></div>
                </div>
              </div>
              <div className="w-2 h-4 bg-gradient-to-b from-yellow-600 to-yellow-700 rounded-b leg-2 ml-2 border border-yellow-800 shadow-sm">
                {/* Knee joint */}
                <div className="absolute top-2 left-0 w-2 h-1 bg-yellow-700 rounded-full"></div>
                {/* Realistic chicken foot with toes */}
                <div className="absolute -bottom-1 -left-1 w-4 h-2 chicken-foot-2">
                  <div className="absolute bottom-0 left-0 w-1 h-1.5 bg-yellow-700 rounded-b-full"></div>
                  <div className="absolute bottom-0 left-1 w-1 h-1.5 bg-yellow-700 rounded-b-full"></div>
                  <div className="absolute bottom-0 left-2 w-1 h-1.5 bg-yellow-700 rounded-b-full"></div>
                  <div className="absolute bottom-0 left-3 w-0.5 h-1 bg-yellow-700 rounded-b-full"></div>
                  {/* Claws */}
                  <div className="absolute -bottom-0.5 left-0 w-0.5 h-0.5 bg-gray-600 rounded-b-full"></div>
                  <div className="absolute -bottom-0.5 left-1 w-0.5 h-0.5 bg-gray-600 rounded-b-full"></div>
                  <div className="absolute -bottom-0.5 left-2 w-0.5 h-0.5 bg-gray-600 rounded-b-full"></div>
                  <div className="absolute -bottom-0.5 left-3 w-0.5 h-0.5 bg-gray-600 rounded-b-full"></div>
                </div>
              </div>
            </div>
            
            {/* Realistic dust cloud with particle physics */}
            <div className="absolute -bottom-1 -left-4 dust-cloud">
              <div className="w-3 h-1.5 bg-gradient-radial from-gray-400 to-transparent rounded-full opacity-70 shadow-sm"></div>
              <div className="w-2 h-1 bg-gradient-radial from-gray-300 to-transparent rounded-full opacity-50 ml-2 -mt-1"></div>
              <div className="w-1.5 h-0.75 bg-gradient-radial from-gray-200 to-transparent rounded-full opacity-40 ml-1 -mt-0.5"></div>
              <div className="w-1 h-0.5 bg-gradient-radial from-gray-100 to-transparent rounded-full opacity-30 ml-1.5 -mt-0.5"></div>
              <div className="w-0.5 h-0.25 bg-gradient-radial from-gray-50 to-transparent rounded-full opacity-20 ml-1 -mt-0.25"></div>
              {/* Individual dust particles */}
              <div className="absolute top-0 left-0 w-0.25 h-0.25 bg-gray-400 rounded-full opacity-60 dust-particle-1"></div>
              <div className="absolute top-0.5 left-2 w-0.25 h-0.25 bg-gray-300 rounded-full opacity-40 dust-particle-2"></div>
              <div className="absolute top-1 left-4 w-0.25 h-0.25 bg-gray-200 rounded-full opacity-30 dust-particle-3"></div>
            </div>
            
            {/* Realistic motion feathers with air dynamics */}
            <div className="absolute top-2 -left-3 motion-feathers opacity-50">
              <div className="w-1.5 h-0.75 bg-gradient-to-r from-amber-300 to-transparent rounded motion-feather-1 shadow-sm"></div>
              <div className="w-1 h-0.5 bg-gradient-to-r from-amber-200 to-transparent rounded mt-0.5 ml-0.5 motion-feather-2 shadow-sm"></div>
              <div className="w-0.75 h-0.25 bg-gradient-to-r from-amber-100 to-transparent rounded mt-0.25 ml-0.25 motion-feather-3"></div>
              <div className="w-0.5 h-0.25 bg-gradient-to-r from-white to-transparent rounded mt-0.25 ml-0.5 motion-feather-4"></div>
            </div>
          </div>
        </div>

        {/* Realistic Chef (chasing behind) */}
        <div className="absolute bottom-4 chef-chaser">
          <div className="relative">
            {/* Realistic Chef Body - better proportions */}
            <div className="w-8 h-11 bg-gradient-to-b from-white to-gray-50 rounded-lg relative border border-gray-300 shadow-lg">
              {/* Professional Chef Hat */}
              <div className="absolute -top-6 left-0 w-8 h-7 bg-gradient-to-t from-white to-gray-50 rounded-t-full border-2 border-gray-300 shadow-md">
                {/* Hat band with texture */}
                <div className="absolute top-5 left-0 w-8 h-1.5 bg-gradient-to-r from-gray-200 to-gray-300 rounded border-t border-gray-400"></div>
                {/* Chef hat puff - more realistic */}
                <div className="absolute -top-2 left-1.5 w-5 h-3 bg-gradient-to-t from-white to-gray-50 rounded-full border border-gray-200 shadow-sm"></div>
                <div className="absolute -top-1 left-2.5 w-3 h-2 bg-white rounded-full shadow-sm"></div>
              </div>
              
              {/* Realistic Face with proper human features */}
              <div className="absolute top-1 left-0.5 w-7 h-5 bg-gradient-to-b from-peach-200 to-peach-300 rounded-lg shadow-sm" style={{ backgroundColor: '#FDBCB4' }}>
                {/* Realistic eyebrows */}
                <div className="absolute top-1 left-1 w-1.5 h-0.5 bg-gradient-to-r from-amber-800 to-amber-700 rounded-full eyebrow-1"></div>
                <div className="absolute top-1 right-1 w-1.5 h-0.5 bg-gradient-to-l from-amber-800 to-amber-700 rounded-full eyebrow-2"></div>
                
                {/* Realistic eyes with depth */}
                <div className="absolute top-1.5 left-1 w-1.5 h-1.5 bg-white rounded-full border border-gray-400 shadow-inner">
                  <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-brown-800 rounded-full" style={{ backgroundColor: '#4A5568' }}></div>
                  <div className="absolute top-0.5 left-0.75 w-0.25 h-0.25 bg-white rounded-full"></div>
                  <div className="absolute top-0 left-0 w-1.5 h-0.75 bg-gradient-to-b from-transparent to-gray-200 rounded-t-full"></div>
                </div>
                <div className="absolute top-1.5 right-1 w-1.5 h-1.5 bg-white rounded-full border border-gray-400 shadow-inner">
                  <div className="absolute top-0.5 right-0.5 w-0.5 h-0.5 bg-brown-800 rounded-full" style={{ backgroundColor: '#4A5568' }}></div>
                  <div className="absolute top-0.5 right-0.75 w-0.25 h-0.25 bg-white rounded-full"></div>
                  <div className="absolute top-0 right-0 w-1.5 h-0.75 bg-gradient-to-b from-transparent to-gray-200 rounded-t-full"></div>
                </div>
                
                {/* Realistic nose with shadow */}
                <div className="absolute top-2 left-3 w-1 h-1.5 bg-gradient-to-b from-peach-300 to-peach-400 rounded-full shadow-sm" style={{ backgroundColor: '#F6AD9B' }}></div>
                <div className="absolute top-2.5 left-3.25 w-0.5 h-0.5 bg-gradient-to-b from-peach-400 to-peach-500 rounded-full" style={{ backgroundColor: '#ED8F7F' }}></div>
                
                {/* Realistic mustache with texture */}
                <div className="absolute bottom-1.5 left-1.5 w-4 h-1 bg-gradient-to-r from-amber-800 to-amber-900 rounded-full shadow-sm"></div>
                <div className="absolute bottom-1.5 left-2 w-1 h-0.5 bg-amber-900 rounded-full"></div>
                <div className="absolute bottom-1.5 right-2 w-1 h-0.5 bg-amber-900 rounded-full"></div>
                
                {/* Realistic mouth showing effort */}
                <div className="absolute bottom-0.5 left-2.5 w-2 h-1 bg-gradient-to-b from-red-600 to-red-800 rounded-full shadow-inner"></div>
                <div className="absolute bottom-0.25 left-2.75 w-1.5 h-0.5 bg-red-700 rounded-full"></div>
                
                {/* Facial shading for depth */}
                <div className="absolute top-0 left-0 w-7 h-2 bg-gradient-to-b from-transparent to-peach-400 rounded-t-lg opacity-30" style={{ backgroundColor: '#ED8F7F' }}></div>
              </div>
              
              {/* Professional Chef Jacket with realistic details */}
              <div className="absolute top-5 left-0 w-8 h-5 bg-gradient-to-b from-white to-gray-50 border-2 border-gray-300 rounded-b-lg shadow-sm">
                {/* Double-breasted buttons - more realistic */}
                <div className="absolute top-1 left-1.5 w-0.75 h-0.75 bg-gradient-to-b from-gray-500 to-gray-600 rounded-full shadow-sm border border-gray-700"></div>
                <div className="absolute top-1 right-1.5 w-0.75 h-0.75 bg-gradient-to-b from-gray-500 to-gray-600 rounded-full shadow-sm border border-gray-700"></div>
                <div className="absolute top-2.5 left-1.5 w-0.75 h-0.75 bg-gradient-to-b from-gray-500 to-gray-600 rounded-full shadow-sm border border-gray-700"></div>
                <div className="absolute top-2.5 right-1.5 w-0.75 h-0.75 bg-gradient-to-b from-gray-500 to-gray-600 rounded-full shadow-sm border border-gray-700"></div>
                {/* Jacket collar */}
                <div className="absolute top-0 left-0 w-8 h-2 bg-gradient-to-b from-white to-gray-100 rounded-t-lg border-b border-gray-300"></div>
                {/* Chest pocket */}
                <div className="absolute top-0.5 left-2 w-4 h-1 bg-white border border-gray-300 rounded"></div>
              </div>
              
              {/* Realistic Arms with chef sleeves and proper anatomy */}
              <div className="absolute top-4 -left-1.5 w-3 h-5 bg-gradient-to-b from-white to-gray-50 rounded arm-swing border-2 border-gray-300 shadow-md">
                {/* Shoulder detail */}
                <div className="absolute top-0 left-0 w-3 h-1 bg-gray-100 rounded-t border-b border-gray-300"></div>
                {/* Sleeve cuff with fold */}
                <div className="absolute bottom-0 left-0 w-3 h-1.5 bg-gradient-to-b from-gray-100 to-gray-200 rounded border-t-2 border-gray-400"></div>
                <div className="absolute bottom-0 left-0 w-3 h-0.5 bg-gray-300 rounded"></div>
                {/* Hand */}
                <div className="absolute -bottom-1 left-0.5 w-2 h-2 bg-gradient-to-b from-peach-200 to-peach-300 rounded-full shadow-sm" style={{ backgroundColor: '#FDBCB4' }}></div>
              </div>
              <div className="absolute top-4 -right-1.5 w-3 h-5 bg-gradient-to-b from-white to-gray-50 rounded arm-swing-2 border-2 border-gray-300 shadow-md">
                {/* Shoulder detail */}
                <div className="absolute top-0 left-0 w-3 h-1 bg-gray-100 rounded-t border-b border-gray-300"></div>
                {/* Sleeve cuff with fold */}
                <div className="absolute bottom-0 left-0 w-3 h-1.5 bg-gradient-to-b from-gray-100 to-gray-200 rounded border-t-2 border-gray-400"></div>
                <div className="absolute bottom-0 left-0 w-3 h-0.5 bg-gray-300 rounded"></div>
                {/* Hand */}
                <div className="absolute -bottom-1 left-0.5 w-2 h-2 bg-gradient-to-b from-peach-200 to-peach-300 rounded-full shadow-sm" style={{ backgroundColor: '#FDBCB4' }}></div>
              </div>
              
              {/* Professional Apron with realistic fabric texture */}
              <div className="absolute top-5 left-0 w-8 h-6 bg-gradient-to-b from-red-500 to-red-600 rounded-b-lg border-2 border-red-700 shadow-md">
                {/* Apron bib */}
                <div className="absolute top-0 left-0 w-8 h-3 bg-gradient-to-b from-red-400 to-red-500 rounded-t-lg border-b border-red-600"></div>
                {/* Apron strings with realistic drape */}
                <div className="absolute top-1 -left-1 w-1 h-3 bg-gradient-to-b from-red-400 to-red-500 rounded transform rotate-12 shadow-sm"></div>
                <div className="absolute top-1 -right-1 w-1 h-3 bg-gradient-to-b from-red-400 to-red-500 rounded transform -rotate-12 shadow-sm"></div>
                {/* Apron pocket with stitching detail */}
                <div className="absolute top-2 left-1.5 w-5 h-2.5 bg-gradient-to-b from-red-400 to-red-500 rounded border-2 border-red-600 shadow-inner">
                  <div className="absolute top-0 left-0 w-5 h-0.5 bg-red-600 rounded-t"></div>
                </div>
                {/* Fabric wrinkles */}
                <div className="absolute top-1 left-1 w-6 h-0.5 bg-red-600 rounded opacity-50"></div>
                <div className="absolute top-3 left-0.5 w-7 h-0.5 bg-red-600 rounded opacity-30"></div>
              </div>
            </div>
            
            {/* Realistic Legs with chef pants and proper anatomy */}
            <div className="absolute -bottom-1 left-2 chef-legs-running">
              <div className="w-2 h-4 bg-gradient-to-b from-gray-200 to-gray-300 rounded-b chef-leg-1 border-2 border-gray-400 shadow-sm">
                {/* Knee detail */}
                <div className="absolute top-2 left-0 w-2 h-1 bg-gray-300 rounded-full"></div>
                {/* Pant cuff */}
                <div className="absolute bottom-0 left-0 w-2 h-0.5 bg-gray-400 rounded"></div>
              </div>
              <div className="w-2 h-4 bg-gradient-to-b from-gray-200 to-gray-300 rounded-b chef-leg-2 ml-2 border-2 border-gray-400 shadow-sm">
                {/* Knee detail */}
                <div className="absolute top-2 left-0 w-2 h-1 bg-gray-300 rounded-full"></div>
                {/* Pant cuff */}
                <div className="absolute bottom-0 left-0 w-2 h-0.5 bg-gray-400 rounded"></div>
              </div>
            </div>
            
            {/* Professional Chef shoes with realistic details */}
            <div className="absolute -bottom-0.5 left-2">
              <div className="w-3 h-1.5 bg-gradient-to-b from-black to-gray-800 rounded-full chef-shoe-1 shadow-md border border-gray-900">
                {/* Shoe sole */}
                <div className="absolute bottom-0 left-0 w-3 h-0.5 bg-gray-700 rounded-full"></div>
                {/* Shoe laces */}
                <div className="absolute top-0.25 left-0.5 w-2 h-0.25 bg-gray-400 rounded"></div>
              </div>
              <div className="w-3 h-1.5 bg-gradient-to-b from-black to-gray-800 rounded-full ml-2 chef-shoe-2 shadow-md border border-gray-900">
                {/* Shoe sole */}
                <div className="absolute bottom-0 left-0 w-3 h-0.5 bg-gray-700 rounded-full"></div>
                {/* Shoe laces */}
                <div className="absolute top-0.25 left-0.5 w-2 h-0.25 bg-gray-400 rounded"></div>
              </div>
            </div>
            
            {/* Realistic sweat drops with better physics */}
            <div className="absolute -top-2 right-0 sweat-drops">
              <div className="w-1 h-2 bg-gradient-to-b from-blue-300 to-blue-500 rounded-full sweat-1 opacity-80 shadow-sm"></div>
              <div className="w-0.75 h-1.5 bg-gradient-to-b from-blue-200 to-blue-400 rounded-full ml-1.5 -mt-1 sweat-2 opacity-60 shadow-sm"></div>
              <div className="w-0.5 h-1 bg-gradient-to-b from-blue-100 to-blue-300 rounded-full ml-1 mt-1 sweat-3 opacity-40 shadow-sm"></div>
            </div>
            
            {/* Enhanced motion lines with better physics */}
            <div className="absolute top-3 -left-4 motion-lines opacity-40">
              <div className="w-3 h-0.5 bg-gradient-to-r from-gray-400 to-transparent rounded motion-line-1"></div>
              <div className="w-2.5 h-0.5 bg-gradient-to-r from-gray-300 to-transparent rounded mt-1 motion-line-2"></div>
              <div className="w-2 h-0.5 bg-gradient-to-r from-gray-200 to-transparent rounded mt-1 motion-line-3"></div>
              <div className="w-1.5 h-0.5 bg-gradient-to-r from-gray-100 to-transparent rounded mt-1 motion-line-4"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading dots */}
      <div className="flex space-x-2 mt-6">
        <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce loading-dot-1"></div>
        <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce loading-dot-2"></div>
        <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce loading-dot-3"></div>
      </div>
    </div>
  );
}

ChickenChaseLoader.propTypes = {
  isVisible: PropTypes.bool,
  message: PropTypes.string
};

export default ChickenChaseLoader;
