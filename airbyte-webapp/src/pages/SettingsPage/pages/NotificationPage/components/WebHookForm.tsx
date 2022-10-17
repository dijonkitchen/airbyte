import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Field, FieldProps, Form, Formik } from "formik";
import React, { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import * as yup from "yup";

import { Label, LabeledSwitch } from "components";
import { Row, Cell } from "components/SimpleTableComponents";
import { Button } from "components/ui/Button";
import { Input } from "components/ui/Input";
import { Text } from "components/ui/Text";
import { Tooltip } from "components/ui/Tooltip";

import { WebhookPayload } from "hooks/services/useWorkspace";
import { equal } from "utils/objects";

import DocsIcon from "../../../../../views/layout/SideBar/components/DocsIcon";
import styles from "./WebHookForm.module.scss";

const webhookValidationSchema = yup.object().shape({
  webhook: yup.string().url("form.url.error"),
  sendOnSuccess: yup.boolean(),
  sendOnFailure: yup.boolean(),
});

interface WebHookFormProps {
  webhook: WebhookPayload;
  successMessage?: React.ReactNode;
  errorMessage?: React.ReactNode;
  onSubmit: (data: WebhookPayload) => void;
  onTest: (data: WebhookPayload) => void;
}

const WebHookForm: React.FC<WebHookFormProps> = ({ webhook, onSubmit, successMessage, errorMessage, onTest }) => {
  const [webhookViewGuide, setWebhookViewGuide] = useState(false);
  const { formatMessage } = useIntl();

  const feedBackBlock = (dirty: boolean, isSubmitting: boolean, webhook?: string) => {
    if (successMessage) {
      return <div>{successMessage}</div>;
    }

    if (errorMessage) {
      return <div>{errorMessage}</div>;
    }

    if (dirty) {
      return null;
    }

    if (webhook && isSubmitting) {
      return null;
    }

    return null;
  };

  const webhookGuide = (
    <div className={styles.webhookGuide}>
      <div className={styles.webhookGuideTitle}>
        <Text as="h5">How to get notification the way you want with your webhook URL?</Text>
        <div>
          <Button type="button" variant="clear" onClick={() => setWebhookViewGuide(false)}>
            <FontAwesomeIcon className={styles.crossIcon} icon={faXmark} />
          </Button>
        </div>
      </div>
      <ul>
        <li>
          <a className={styles.webhookGuideLink} href="/#">
            <DocsIcon />
            <Text className={styles.text} size="lg">
              Configure Sync notifications
            </Text>
          </a>
        </li>
        <li>
          <a className={styles.webhookGuideLink} href="/#">
            <DocsIcon />
            <Text className={styles.text} size="lg">
              Configure a Slack Notifications Webhook
            </Text>
          </a>
        </li>
      </ul>
      <img
        className={styles.webhookGuideImg}
        alt="Need help with Webhook URL?"
        src="/images/octavia/webhook-guide.png"
      />
    </div>
  );

  return (
    <Formik
      initialValues={webhook}
      enableReinitialize
      validateOnBlur
      validateOnChange={false}
      validationSchema={webhookValidationSchema}
      onSubmit={(values: WebhookPayload) => {
        if (equal(webhook, values)) {
          onTest(values);
        } else {
          onSubmit(values);
        }
      }}
    >
      {({ isSubmitting, initialValues, dirty, errors, values }) => (
        <Form>
          {webhookViewGuide ? webhookGuide : null}
          <Row>
            <Cell>
              <Label
                error={!!errors.webhook}
                message={!!errors.webhook && <FormattedMessage id={errors.webhook} defaultMessage={errors.webhook} />}
              >
                <FormattedMessage id="settings.webhookTitle" />
              </Label>
            </Cell>
            <Cell className={styles.webhookGuideButtonSection}>
              {!webhookViewGuide ? (
                <>
                  <Button
                    className={styles.webhookGuideButton}
                    variant="clear"
                    onClick={() => setWebhookViewGuide(true)}
                  >
                    Need help with Webhook URL?
                  </Button>
                  <img
                    className={styles.webhookGuideButtonImg}
                    alt="Need help with Webhook URL?"
                    src="/images/octavia/webhook-guide.png"
                  />
                </>
              ) : null}
            </Cell>
          </Row>
          <Row className={styles.webhookRow}>
            <Cell>
              <Field name="webhook">
                {({ field, meta }: FieldProps<string>) => (
                  <Input
                    {...field}
                    placeholder={formatMessage({
                      id: "settings.yourWebhook",
                    })}
                    error={!!meta.error && meta.touched}
                  />
                )}
              </Field>
            </Cell>
            <Cell>
              <Tooltip
                className={styles.tooltip}
                placement="top"
                control={
                  <Button
                    type="button"
                    isLoading={isSubmitting}
                    variant="secondary"
                    disabled={!values.webhook || !!errors.webhook}
                    onClick={() => onTest(values)}
                  >
                    <FormattedMessage id="settings.test" />
                  </Button>
                }
              >
                <FormattedMessage id="settings.webhookTestText" />
              </Tooltip>
            </Cell>
            {feedBackBlock(dirty, isSubmitting, initialValues.webhook)}
          </Row>
          <Label>Notify me:</Label>
          <Row className={styles.notificationRow}>
            <Cell className={styles.notificationCell}>
              <Field name="sendOnFailure">
                {({ field }: FieldProps<boolean>) => (
                  <LabeledSwitch
                    name={field.name}
                    checked={field.value}
                    onChange={field.onChange}
                    label={<FormattedMessage id="settings.sendOnFailure" />}
                  />
                )}
              </Field>
              <Field name="sendOnSuccess">
                {({ field }: FieldProps<boolean>) => (
                  <LabeledSwitch
                    name={field.name}
                    checked={field.value}
                    onChange={field.onChange}
                    label={<FormattedMessage id="settings.sendOnSuccess" />}
                  />
                )}
              </Field>
            </Cell>
          </Row>
          <Row>
            <Cell className={styles.actionsCell}>
              <Button isLoading={isSubmitting} type="submit">
                <FormattedMessage id="form.saveChanges" />
              </Button>
            </Cell>
          </Row>
        </Form>
      )}
    </Formik>
  );
};

export default WebHookForm;
