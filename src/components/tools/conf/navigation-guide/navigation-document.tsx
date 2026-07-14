import type { ReactNode } from "react";
import { BOOKLET_A4, C } from "../booklet/constants";
import { PageHeader } from "../booklet/PageHeader";
import { PageFooter } from "../booklet/PageFooter";
import { NAV_ASSETS } from "./assets";
import { NAV_GUIDE_META, NAV_PREFACE, NAV_TOC } from "./content-data";
import { NavigationCoverPage } from "./NavigationCoverPage";
import {
  SectionHeading,
  SubHeading,
  BodyText,
  StepList,
  BulletList,
  WarningCallout,
  InfoCallout,
  NavFullWidthImage,
  NavDualImagesFull,
  NavImagePage,
  PageContent,
  HubTable,
  CheatSheetBox,
  ContactSupportBlock,
  HotelMapCallout,
} from "./ui-blocks";

export const NAV_GUIDE_TOTAL_PAGES = 13;

function NavA4Page({
  children,
  pageNum,
  sectionLabel,
}: {
  children: ReactNode;
  pageNum: number;
  sectionLabel: string;
}) {
  return (
    <div
      className="booklet-page"
      style={{
        width: `${BOOKLET_A4.width}px`,
        height: `${BOOKLET_A4.height}px`,
        maxHeight: `${BOOKLET_A4.height}px`,
        background: C.white,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <PageHeader
        confName={NAV_GUIDE_META.confName}
        sectionLabel={sectionLabel}
        pageNum={pageNum}
      />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "100%",
          padding: "20px 40px 12px",
          overflow: "hidden",
        }}
      >
        <PageContent>{children}</PageContent>
      </div>
      <PageFooter
        confName={NAV_GUIDE_META.confName}
        confYear={NAV_GUIDE_META.confYear}
        pageNum={pageNum}
        totalPages={NAV_GUIDE_TOTAL_PAGES}
      />
    </div>
  );
}

export function NavigationDocument({ gap = 0 }: { gap?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: `${gap}px` }}>
      {/* Page 1 — Cover */}
      <NavigationCoverPage />

      {/* Page 2 — TOC + Preface */}
      <NavA4Page pageNum={2} sectionLabel="Contents">
        <SectionHeading level={1}>Table of Contents</SectionHeading>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            marginBottom: "8px",
            width: "100%",
          }}
        >
          {NAV_TOC.map((entry) => (
            <div key={entry.num}>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: C.blue,
                  lineHeight: 1.4,
                }}
              >
                {entry.num}. {entry.title}
              </div>
              {"subs" in entry &&
                entry.subs?.map((sub) => (
                  <div
                    key={sub}
                    style={{
                      fontSize: "9px",
                      color: C.muted,
                      paddingLeft: "14px",
                      lineHeight: 1.4,
                    }}
                  >
                    – {sub}
                  </div>
                ))}
            </div>
          ))}
        </div>

        <div
          style={{
            height: "2px",
            background: `linear-gradient(90deg, ${C.red}, ${C.blue})`,
            margin: "6px 0",
            borderRadius: "1px",
            width: "100%",
          }}
        />

        <SectionHeading level={2}>Preface</SectionHeading>
        <BodyText>{NAV_PREFACE}</BodyText>

        <InfoCallout>
          <strong>Document Structure:</strong> Section A covers train + public
          transit routes. Section B covers private car and taxi driving options
          for each arrival station.
        </InfoCallout>
      </NavA4Page>

      {/* Page 3 — Travel Hubs */}
      <NavA4Page pageNum={3} sectionLabel="Travel Hubs">
        <SectionHeading id="hubs" level={1}>
          1. Key Travel Hub Overview
        </SectionHeading>
        <BodyText>
          All conference attendees will arrive at one of 3 Jinan train stations;
          travel distance &amp; time varies drastically:
        </BodyText>
        <HubTable />
        <HotelMapCallout compact />
        <BodyText>
          All public transit routes end with taking Bus K904 to reach the hotel.
        </BodyText>
        <NavFullWidthImage
          src={NAV_ASSETS.metroStationEntrance}
          alt="Jinan metro station entrance"
          caption="Jinan metro station entrance — follow signage for Line transfers"
          minHeight={280}
          maxHeight={420}
          objectFit="cover"
          flex
        />
      </NavA4Page>

      {/* Page 4 — Route 1 West transit: steps + metro route maps */}
      <NavA4Page pageNum={4} sectionLabel="Route 1 · Transit">
        <SectionHeading id="route1-transit" level={1}>
          2. Route 1: Jinan West Railway Station (Recommended)
        </SectionHeading>
        <SubHeading>
          Section A — Public Transit (Subway Line 4 → Line 2 → K904 Bus)
        </SubHeading>
        <InfoCallout>
          Total estimated time: ~70–80 mins · Total transit fare: ¥10 (Subway
          ¥4 + Bus K904 ¥6)
        </InfoCallout>
        <StepList
          steps={[
            "Walk 4 minutes (900ft) from station exit to Jinanxi Railway Station West Square Subway Station",
            "Board Metro Line 4, direction Pengjiazhuang — Operating Hours: 6:05 AM – 10:35 PM | Trains every 12 mins — Ride 3 stops (8 mins), exit at Lashan Station",
            "1-minute indoor transfer to Metro Line 2",
            "Board Metro Line 2, direction Pengjiazhuang — Operating Hours: 6:06 AM – 10:26 PM | Trains every 10 mins | Free subway transfer — Ride 5 stops (11 mins), exit at Jinan Railway Station North (Exit B)",
            "Walk 5 minutes (0.2 miles) to Jinan Long-distance Transport Center Bus Stop (Dikou Lu)",
            "Board Bus K904, direction Qihe Jiakao Zhongxin — Operating Hours: 6:00 AM – 7:20 PM | Buses every 20 mins | Fare ¥6 — Ride 9 stops (43 mins), exit at Guoke Guoji Bus Stop",
            "8-minute walk (0.3 miles) to Arcadia Spa Golf International Hotel",
          ]}
        />
        <SubHeading>Route 1 Metro Route Maps (Jinan West)</SubHeading>
        <BodyText>
          Reference screenshots for the Line 4 → Line 2 transfer and the Line 2
          → K904 bus connection on the Jinan West route.
        </BodyText>
        <NavDualImagesFull
          left={{
            src: NAV_ASSETS.westMetroLine4ToLine2,
            alt: "Jinan West metro Line 4 to Line 2",
            caption: "Line 4 → Line 2 transfer at Lashan",
          }}
          right={{
            src: NAV_ASSETS.westLine2K904Transit,
            alt: "Jinan West Line 2 to K904 bus",
            caption: "Line 2 → K904 bus connection",
          }}
        />
      </NavA4Page>

      {/* Page 5 — Route 1 West taxi */}
      <NavA4Page pageNum={5} sectionLabel="Route 1 · Taxi">
        <SubHeading>
          Section B — Taxi / Private Car Direct Drive (Jinan West)
        </SubHeading>
        <BulletList
          items={[
            "Fastest Route: 23 minutes, 13 miles | Highway toll ¥20",
            "Budget Toll Route: 32 minutes, 12–15 miles | Highway toll ¥10",
            "Note: Taxis accept WeChat/Alipay cashless payment; pre-save hotel Chinese name for drivers: 齐河阿尔卡迪亚温泉高尔夫国际酒店",
          ]}
        />
        <NavFullWidthImage
          src={NAV_ASSETS.westDrivingRoutes}
          alt="Jinan West driving routes to hotel"
          caption="Driving routes from Jinan West Railway Station"
          objectFit="cover"
          flex
        />
      </NavA4Page>

      {/* Page 6 — Route 2 transit steps + K904 bus */}
      <NavA4Page pageNum={6} sectionLabel="Route 2 · Transit">
        <SectionHeading id="route2-transit" level={1}>
          3. Route 2: Jinan Railway Station (Downtown Jinan)
        </SectionHeading>
        <SubHeading>
          Section A — Direct Bus Only Route (Simplest Public Transit)
        </SubHeading>
        <InfoCallout>
          Total estimated time: ~50–60 mins · Fare: ¥6
        </InfoCallout>
        <StepList
          steps={[
            "Walk 9 minutes (0.3 miles) from station to Jinan Long-distance Bus Station (Zhige Jie) Bus Stop",
            "Board Bus K904, direction Qihe Jiakao Zhongxin — Ride 8 stops (38–39 mins), exit at Guoke Guoji Bus Stop",
            "8-minute walk to hotel",
          ]}
        />
        <NavFullWidthImage
          src={NAV_ASSETS.railwayStationK904Bus}
          alt="Jinan Railway Station K904 bus route"
          caption="Direct K904 from downtown Jinan Railway Station"
          objectFit="cover"
          flex
        />
      </NavA4Page>

      {/* Page 7 — Route 2 transit details + taxi + driving */}
      <NavA4Page pageNum={7} sectionLabel="Route 2 · Details">
        <SubHeading>Route 2 Full Transit Details (Reference)</SubHeading>
        <NavFullWidthImage
          src={NAV_ASSETS.railwayStationTransitDetails}
          alt="Jinan Railway Station transit details"
          caption="Full transit details screenshot — downtown station to hotel"
          objectFit="cover"
          flex
        />
        <SubHeading>
          Section B — Taxi / Private Car Direct Drive (Jinan Railway Station)
        </SubHeading>
        <BulletList
          items={[
            "Estimated drive time: 36 minutes, 15 miles | Highway toll ¥10",
          ]}
        />
        <NavFullWidthImage
          src={NAV_ASSETS.railwayStationDrivingMap}
          alt="Jinan Railway Station driving map"
          caption="Driving route from Jinan Railway Station to hotel"
          objectFit="cover"
          flex
        />
      </NavA4Page>

      {/* Page 8 — Route 3 East transit steps + metro map */}
      <NavA4Page pageNum={8} sectionLabel="Route 3 · Transit">
        <SectionHeading id="route3-transit" level={1}>
          4. Route 3: Jinan East Railway Station (Farthest Hub)
        </SectionHeading>
        <SubHeading>
          Section A — Public Transit (Subway Line 3 → Line 2 → K904 Bus)
        </SubHeading>
        <InfoCallout>
          Total estimated time: ~90–100 mins · Total fare: ¥11 (Subway ¥5 +
          Bus K904 ¥6)
        </InfoCallout>
        <StepList
          steps={[
            "Enter Metro Line 3 at Jinandong Railway Station, direction Longdong — Operating Hours: 6:03 AM – 10:21 PM | Trains every 10 mins | Fare ¥5 — Ride 4 stops (12 mins), exit at Bajianpu Station",
            "2-minute transfer to Metro Line 2",
            "Board Metro Line 2, direction Wangfuzhuang — Operating Hours: 6:00 AM – 10:36 PM | Trains every 10 mins | Free transfer — Ride 6 stops (15 mins), exit at Jiluolu Station (Exit C)",
            "Walk to Jinan Long-distance Bus Station (Zhige Jie) Bus Stop",
            "Board Bus K904 (¥6), ride 8 stops, exit at Guoke Guoji Bus Stop",
            "8-minute walk to hotel",
          ]}
        />
        <SubHeading>Route 3 Metro Route Map (Jinan East)</SubHeading>
        <BodyText>
          Line 3 → Line 2 transfer from Jinan East Railway Station.
        </BodyText>
        <NavFullWidthImage
          src={NAV_ASSETS.eastMetroLine3ToLine2}
          alt="Jinan East metro Line 3 to Line 2"
          caption="Line 3 → Line 2 transfer from Jinan East"
          objectFit="cover"
          flex
        />
      </NavA4Page>

      {/* Page 9 — Route 3 East K904 transfer */}
      <NavA4Page pageNum={9} sectionLabel="Route 3 · K904">
        <NavImagePage
          title={
            <SubHeading>Route 3 K904 Bus Connection (Jinan East)</SubHeading>
          }
          subtitle={
            <BodyText>
              After exiting Metro Line 2, walk to the K904 bus stop and board
              toward Qihe Jiakao Zhongxin.
            </BodyText>
          }
          image={{
            src: NAV_ASSETS.eastK904Transfer,
            alt: "Jinan East K904 transfer",
            caption: "K904 bus connection from Jinan East route",
            objectFit: "cover",
          }}
        />
      </NavA4Page>

      {/* Page 10 — Route 3 East taxi + driving */}
      <NavA4Page pageNum={10} sectionLabel="Route 3 · Taxi">
        <SubHeading>
          Section B — Taxi / Private Car Direct Drive (Jinan East)
        </SubHeading>
        <BulletList
          items={[
            "Fastest Route: 38 minutes, 28 miles | Toll ¥22",
            "Standard Suggested Route: 50 minutes, 23 miles | Toll ¥10",
          ]}
        />
        <NavFullWidthImage
          src={NAV_ASSETS.eastDrivingRoutes}
          alt="Jinan East driving routes"
          caption="Driving routes from Jinan East Railway Station"
          objectFit="cover"
          flex
        />
      </NavA4Page>

      {/* Page 11 — K904 Rules */}
      <NavA4Page pageNum={11} sectionLabel="K904 Rules">
        <SectionHeading id="k904-rules" level={1}>
          5. Critical Bus K904 Rules for All Attendees
        </SectionHeading>
        <BodyText>
          This bus is mandatory for all public transit routes to the hotel; read
          carefully:
        </BodyText>

        <WarningCallout>
          ⚠ CRITICAL: Bus K904 operates ONLY from 6:00 AM – 7:20 PM. If you
          arrive after 7:20 PM, NO public bus service is available — you must
          take a taxi or private car to the hotel.
        </WarningCallout>

        <BulletList
          items={[
            "Operating Window: Only runs 6:00 AM – 7:20 PM. If you arrive after 7:20 PM, NO public bus service available – you must take a taxi/car to the hotel.",
            "Frequency: Departs every 20 minutes (plan arrival at bus stop ahead of time to avoid long waits)",
            "Fare: Fixed ¥6 cash / mobile pay accepted",
            "Destination Direction Confirmation: Always board K904 marked Toward Qihe Jiakao Zhongxin",
            "Drop-off Stop: Alight at Guoke Guoji (stop after YuanLinChang) – do not miss this stop",
            "Last Leg Walk: After exiting Guoke Guoji stop, 8-minute flat walk straight to hotel entrance (0.3 miles)",
          ]}
        />

        <NavFullWidthImage
          src={NAV_ASSETS.k904StopWalkToHotel}
          alt="Walk from K904 bus stop to hotel"
          caption="Final walk from Guoke Guoji bus stop to hotel"
          objectFit="cover"
          flex
        />
      </NavA4Page>

      {/* Page 12 — Walking + Cheat Sheet */}
      <NavA4Page pageNum={12} sectionLabel="Walking & Cheat Sheet">
        <SectionHeading id="walking" level={1}>
          6. Hotel Final Walking Directions (From Guoke Guoji Bus Stop)
        </SectionHeading>
        <BodyText>
          After stepping off K904 at Guoke Guoji Bus Stop:
        </BodyText>
        <StepList
          steps={[
            "Head north on the main roadside pedestrian walkway",
            "Pass the commercial plaza on your left",
            "Continue straight for 8 minutes; the large Arcadia Spa Golf International Hotel main gate will be visible on your right",
            "Enter through the main lobby entrance for conference check-in",
          ]}
        />
        <HotelMapCallout />

        <SectionHeading id="cheat-sheet" level={1}>
          7. Attendee Quick Reference Cheat Sheet
        </SectionHeading>
        <CheatSheetBox />
      </NavA4Page>

      {/* Page 13 — Support Contacts + hotel photo */}
      <NavA4Page pageNum={13} sectionLabel="Support Contacts">
        <SectionHeading level={1}>Conference Travel Support</SectionHeading>
        <BodyText>
          For travel assistance before or during the conference, contact the
          logistics team:
        </BodyText>
        <ContactSupportBlock />

        <NavFullWidthImage
          src="/conf/assets/hotel/main_entrance_view.png"
          alt="Arcadia Spa Golf International Hotel entrance"
          caption="Arcadia Spa Golf International Hotel — Conference Venue"
          objectFit="cover"
          flex
        />
      </NavA4Page>
    </div>
  );
}
