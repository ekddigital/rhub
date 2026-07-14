/** Static navigation guide images (served from /public/conf/navigation). */
export const NAV_ASSETS = {
  metroStationEntrance: "/conf/navigation/jinan-metro-station-entrance.jpg",
  westMetroLine4ToLine2: "/conf/navigation/jinan-west-metro-line4-to-line2.png",
  westLine2K904Transit: "/conf/navigation/jinan-west-line2-k904-transit.png",
  westDrivingRoutes: "/conf/navigation/jinan-west-driving-routes.png",
  railwayStationK904Bus: "/conf/navigation/jinan-railway-station-k904-bus.png",
  railwayStationTransitDetails:
    "/conf/navigation/jinan-railway-station-transit-details.png",
  railwayStationDrivingMap:
    "/conf/navigation/jinan-railway-station-driving-map.png",
  eastMetroLine3ToLine2: "/conf/navigation/jinan-east-metro-line3-to-line2.png",
  eastK904Transfer: "/conf/navigation/jinan-east-k904-transfer.png",
  eastDrivingRoutes: "/conf/navigation/jinan-east-driving-routes.png",
  k938ToK904Transfer: "/conf/navigation/k938-to-k904-transfer.png",
  k904StopWalkToHotel: "/conf/navigation/k904-stop-walk-to-hotel.png",
} as const;

export const NAV_PDF_STATIC_ASSETS = [
  ...Object.values(NAV_ASSETS),
  "/conf/lsuic_logo.png",
  "/conf/liberia-seal.svg",
  "/conf/assets/jinan_city/evening_view_portrait.png",
  "/conf/assets/hotel/main_entrance_view.png",
] as const;
