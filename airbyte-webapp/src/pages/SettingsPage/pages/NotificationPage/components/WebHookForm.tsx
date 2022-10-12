import { Field, FieldProps, Form, Formik } from "formik";
import React from "react";
import { FormattedMessage, useIntl } from "react-intl";
// import styled from "styled-components";
import * as yup from "yup";

import { Label, LabeledSwitch } from "components";
import { Row, Cell } from "components/SimpleTableComponents";
import { Button } from "components/ui/Button";
import { Input } from "components/ui/Input";
import { Tooltip } from "components/ui/Tooltip";

import { WebhookPayload } from "hooks/services/useWorkspace";
import { equal } from "utils/objects";

// const Text = styled.div`
//   font-style: normal;
//   font-weight: normal;
//   font-size: 13px;
//   line-height: 150%;
//   padding-bottom: 5px;
// `;

// const InputRow = styled(Row)`
//   height: auto;
//   margin-bottom: 40px;
// `;

// const Message = styled(Text)`
//   margin: -40px 0 21px;
//   padding: 0;
//   color: ${({ theme }) => theme.greyColor40};
// `;

// const FeedbackCell = styled(Cell)`
//   &:last-child {
//     text-align: left;
//   }
//   padding-left: 11px;
// `;

// const Success = styled.div`
//   font-size: 13px;
//   color: ${({ theme }) => theme.successColor};
// `;
//
// const Error = styled(Success)`
//   color: ${({ theme }) => theme.dangerColor};
// `;

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
  const { formatMessage } = useIntl();

  const feedBackBlock = (dirty: boolean, isSubmitting: boolean, webhook?: string) => {
    console.log("isSubmitting", isSubmitting);
    console.log("webhook", webhook);
    console.log("dirty", dirty);

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
      {({ isSubmitting, initialValues, dirty, errors }) => (
        <Form>
          <Label
            error={!!errors.webhook}
            message={!!errors.webhook && <FormattedMessage id={errors.webhook} defaultMessage={errors.webhook} />}
          >
            <FormattedMessage id="settings.webhookTitle" />
          </Label>
          {/* <Text> */}
          {/*   <FormattedMessage id="settings.webhookDescription" /> */}
          {/* </Text> */}
          <Row>
            <Cell flex={3}>
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
            {/* <Cell>{feedBackBlock(dirty, isSubmitting, initialValues.webhook)}</Cell> */}
            <Cell>
              <Tooltip
                placement="top"
                disabled={!!initialValues.webhook || !!errors.webhook}
                control={
                  <Button isLoading={isSubmitting} variant="secondary" type="submit">
                    <FormattedMessage id="settings.test" />
                  </Button>
                }
              >
                <FormattedMessage id="settings.webhookTestText" />
              </Tooltip>
            </Cell>
            {feedBackBlock(dirty, isSubmitting, initialValues.webhook)}
          </Row>
          {/* {initialValues.webhook ? ( */}
          {/*   <Text> */}
          {/*     <FormattedMessage id="settings.webhookTestText" /> */}
          {/*   </Text> */}
          {/* ) : null} */}
          <Row>
            <Cell flex={1}>
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
            </Cell>
            <Cell flex={1}>
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
          <Button isLoading={isSubmitting} type="submit">
            <FormattedMessage id="form.saveChanges" />
          </Button>
        </Form>
      )}
    </Formik>
  );
};

export default WebHookForm;
