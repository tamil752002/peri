import { useContext, useEffect, useRef, useState } from "react";
import {
  IonContent,
  IonPage,
  IonLabel,
  useIonRouter,
  IonDatetime,
  IonButton,
  IonCol,
  IonIcon,
  IonButtons,
  useIonAlert,
} from "@ionic/react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useTranslation } from "react-i18next";
import { isSameDay, parseISO, startOfDay, startOfToday } from "date-fns";
import { CyclesContext } from "../state/Context";

import { storage } from "../data/Storage";

import Welcome from "../modals/WelcomeModal";
import InfoModal from "../modals/InfoModal";

import {
  getPregnancyChance,
  getDaysBeforePeriod,
  isForecastPeriodDays,
  isForecastPeriodToday,
  getNewCyclesHistory,
  getLastPeriodDays,
  getActiveDates,
  getPastFuturePeriodDays,
  isPeriodToday,
  isMarkedFutureDays,
} from "../state/CalculationLogics";
import { getCurrentTranslation } from "../utils/translation";

import { chevronForwardOutline } from "ionicons/icons";

interface InfoButtonProps {
  setIsInfoModal: (newIsOpen: boolean) => void;
}

const InfoButton = (props: InfoButtonProps) => {
  const { t } = useTranslation();
  const cycles = useContext(CyclesContext).cycles;
  const pregnancyChance = getPregnancyChance(cycles);
  if (cycles.length === 0) {
    return <></>;
  }
  return (
    <IonLabel
      class="info-button"
      onClick={() => props.setIsInfoModal(true)}
    >
      <p
        style={{
          fontSize: "14px",
          color: "var(--ion-color-medium)",
          marginBottom: "20px",
        }}
      >
        <span style={{ color: "var(--ion-color-dark)" }}>
          {pregnancyChance}
        </span>{" "}
        - {t("chance of getting pregnant")}
        <IonIcon
          color="medium"
          slot="end"
          icon={chevronForwardOutline}
        />
      </p>
    </IonLabel>
  );
};

const ViewCalendar = () => {
  const { t } = useTranslation();
  const { cycles } = useContext(CyclesContext);

  const lastPeriodDays = getLastPeriodDays(cycles);

  return (
    <IonDatetime
      style={{ borderRadius: "20px" }}
      color="light"
      presentation="date"
      locale={getCurrentTranslation()}
      size="cover"
      firstDayOfWeek={1}
      highlightedDates={(isoDateString) => {
        if (cycles.length === 0) {
          return undefined;
        }

        const date = startOfDay(parseISO(isoDateString));
        if (isSameDay(date, startOfToday()) && isForecastPeriodToday(cycles)) {
          return {
            backgroundColor: "rgba(var(--ion-color-light-basic-rgb), 0.5)",
          };
        } else if (isForecastPeriodDays(date, cycles)) {
          return {
            textColor: "var(--ion-color-dark)",
            backgroundColor: "rgba(var(--ion-color-light-basic-rgb), 0.5)",
          };
        } else if (lastPeriodDays.includes(isoDateString)) {
          return {
            textColor: "#000",
            backgroundColor: "var(--ion-color-light-basic)",
          };
        }

        return undefined;
      }}
    >
      <IonButtons slot="buttons">
        <IonButton
          color="dark-basic"
          onClick={() => {}}
        >
          {t("edit")}
        </IonButton>
      </IonButtons>
    </IonDatetime>
  );
};

const EditCalendar = () => {
  const datetimeRef = useRef<null | HTMLIonDatetimeElement>(null);
  const [cannotSaveAlert] = useIonAlert();

  const { t } = useTranslation();
  const { cycles, updateCycles } = useContext(CyclesContext);

  useEffect(() => {
    if (!datetimeRef.current) return;
    const lastPeriodDays = getLastPeriodDays(cycles);
    if (!lastPeriodDays.length) {
      return;
    }
    datetimeRef.current.value = lastPeriodDays;
  }, [cycles]);

  return (
    <IonDatetime
      style={{ borderRadius: "20px" }}
      color="light-basic"
      ref={datetimeRef}
      presentation="date"
      locale={getCurrentTranslation()}
      size="cover"
      multiple
      firstDayOfWeek={1}
      isDateEnabled={(isoDateString) => {
        return getActiveDates(parseISO(isoDateString), cycles);
      }}
    >
      <IonButtons slot="buttons">
        <IonButton
          color="dark-basic"
          onClick={() => {
            datetimeRef.current?.confirm().catch((err) => console.error(err));
            if (datetimeRef.current?.value) {
              const periodDaysString = (
                datetimeRef.current.value as string[]
              ).map((isoDateString) => {
                return parseISO(isoDateString).toString();
              });

              if (isMarkedFutureDays(periodDaysString)) {
                datetimeRef.current.value = getLastPeriodDays(cycles);

                cannotSaveAlert({
                  header: t("You can't mark future days"),
                  buttons: ["OK"],
                }).catch((err) => console.error(err));

                return;
              }
              updateCycles(getNewCyclesHistory(periodDaysString));
            }
          }}
        >
          {t("save")}
        </IonButton>
      </IonButtons>
    </IonDatetime>
  );
};

interface HomeProps {
  isLanguageModal: boolean;
  setIsLanguageModal: (newIsOpen: boolean) => void;
}

const TabHome = (props: HomeProps) => {
  const [isInfoModal, setIsInfoModal] = useState(false);
  const [isWelcomeModal, setIsWelcomeModal] = useState(false);
  const [periodTodayAlert] = useIonAlert();

  const router = useIonRouter();

  useEffect(() => {
    storage.get.cycles().catch((err) => {
      console.error(`Can't get cycles ${(err as Error).message}`);
      setIsWelcomeModal(true);
    });
  }, []);

  useEffect(() => {
    const backButtonHandler = () => {
      if (isInfoModal || props.isLanguageModal) {
        setIsInfoModal(false);
        props.setIsLanguageModal(false);
        router.push("/home");
        return;
      }
      if (!Capacitor.isPluginAvailable("App")) {
        return;
      }
      App.exitApp?.().catch((err) => console.error(err));
    };

    document.addEventListener("ionBackButton", backButtonHandler);

    return () => {
      document.removeEventListener("ionBackButton", backButtonHandler);
    };
  }, [router, isInfoModal, props]);

  const { t } = useTranslation();
  const { cycles, updateCycles } = useContext(CyclesContext);

  return (
    <IonPage style={{ backgroundColor: "var(--ion-color-background)" }}>
      <div id="wide-screen">
        <IonContent
          className="ion-padding"
          color="transparent-basic"
        >
          <Welcome
            isOpen={isWelcomeModal}
            setIsOpen={setIsWelcomeModal}
            isLanguageModal={props.isLanguageModal}
            setIsLanguageModal={props.setIsLanguageModal}
          />
          <div id="context-size">
            <div style={{ marginTop: "30px", marginBottom: "30px" }}>
              <IonLabel>
                <p style={{ fontSize: "35px", color: "var(--ion-color-dark)" }}>
                  {getDaysBeforePeriod(cycles).title}
                </p>
              </IonLabel>
            </div>
            <div>
              <IonLabel>
                <p
                  style={{
                    fontWeight: "bold",
                    fontSize: "40px",
                    color: "var(--ion-color-dark-basic)",
                    marginBottom: "30px",
                  }}
                >
                  {getDaysBeforePeriod(cycles).days}
                </p>
              </IonLabel>
            </div>
            <InfoButton setIsInfoModal={setIsInfoModal} />
            <InfoModal
              isOpen={isInfoModal}
              setIsOpen={setIsInfoModal}
            />
            <IonCol style={{ marginBottom: "20px" }}>
              <IonButton
                className="main"
                color="dark-basic"
                onClick={() => {
                  if (isPeriodToday(cycles)) {
                    periodTodayAlert({
                      header: t("Period today"),
                      buttons: ["OK"],
                    }).catch((err) => console.log(err));
                    return;
                  }
                  const newCycles = getNewCyclesHistory(
                    getPastFuturePeriodDays(cycles),
                  );
                  updateCycles(newCycles);
                }}
              >
                {t("mark")}
              </IonButton>
            </IonCol>
            <IonCol>
              <ViewCalendar />
              {/* <EditCalendar /> */}
            </IonCol>
          </div>
        </IonContent>
      </div>
    </IonPage>
  );
};

export default TabHome;
