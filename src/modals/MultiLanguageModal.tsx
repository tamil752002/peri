import {
  IonLabel,
  IonButton,
  IonIcon,
  IonModal,
  IonCard,
  IonCardContent,
  IonList,
  IonRadioGroup,
  IonRadio,
  IonItem,
} from "@ionic/react";
import { globeOutline } from "ionicons/icons";
import { useTranslation } from "react-i18next";
import { enGB, ru } from "date-fns/locale";
import setDefaultOptions from "date-fns/setDefaultOptions";
import { storage } from "../data/Storage";
import "./MultiLanguageModal.css";

interface PropsLanguageModal {
  isOpen: boolean;
  setIsOpen: (newIsOpen: boolean) => void;
}

const MultiLanguage = (props: PropsLanguageModal) => {
  const { t, i18n } = useTranslation();
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng).catch((err) => console.error(err));
    storage.set.language(lng.toString()).catch((err) => console.error(err));
  };

  if (t("locale") === "en-GB") {
    setDefaultOptions({ locale: enGB });
  } else if (t("locale") === "ru") {
    setDefaultOptions({ locale: ru });
  }

  return (
    <>
      <IonButton
        slot="end"
        fill="clear"
        onClick={() => props.setIsOpen(true)}
      >
        <IonIcon
          color="light"
          icon={globeOutline}
        />
      </IonButton>
      <IonModal
        isOpen={props.isOpen}
        id="settings-modal"
        backdropDismiss={false}
      >
        <IonCard color="light">
          <IonCardContent class="align-center">
            <IonList>
              <IonRadioGroup value={i18n.language}>
                <IonItem>
                  <IonLabel>english</IonLabel>
                  <IonRadio
                    color="basic"
                    slot="end"
                    value="en"
                    onClick={() => {
                      changeLanguage("en");
                    }}
                  ></IonRadio>
                </IonItem>

                <IonItem>
                  <IonLabel>русский</IonLabel>
                  <IonRadio
                    color="basic"
                    slot="end"
                    value="ru"
                    onClick={() => {
                      changeLanguage("ru");
                    }}
                  ></IonRadio>
                </IonItem>
              </IonRadioGroup>
            </IonList>
            <IonButton
              color="basic"
              onClick={() => {
                props.setIsOpen(false);
              }}
            >
              Ok
            </IonButton>
          </IonCardContent>
        </IonCard>
      </IonModal>
    </>
  );
};

export default MultiLanguage;