import { Field, FieldArray } from "formik";
import React, { useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { useToggle } from "react-use";
import styled from "styled-components";

import { Card } from "components/ui/Card";
import { Text } from "components/ui/Text";

import { buildConnectionUpdate, NormalizationType } from "core/domain/connection";
import {
  ConnectionStatus,
  OperationCreate,
  OperationRead,
  OperatorType,
  WebBackendConnectionRead,
} from "core/request/AirbyteClient";
import { useTrackPage, PageTrackingCodes } from "hooks/services/Analytics";
import { ConnectionFormMode } from "hooks/services/ConnectionForm/ConnectionFormService";
import { FeatureItem, useFeature } from "hooks/services/Feature";
import { useUpdateConnection } from "hooks/services/useConnectionHook";
import { useCurrentWorkspace } from "hooks/services/useWorkspace";
import { useGetDestinationDefinitionSpecification } from "services/connector/DestinationDefinitionSpecificationService";
import { FormikOnSubmit } from "types/formik";
import { NormalizationField } from "views/Connection/ConnectionForm/components/NormalizationField";
import { TransformationField } from "views/Connection/ConnectionForm/components/TransformationField";
import {
  getInitialNormalization,
  getInitialTransformations,
  mapFormPropsToOperation,
} from "views/Connection/ConnectionForm/formConfig";
import { FormCard } from "views/Connection/FormCard";

import { DbtCloudTransformationsCard } from "./ConnectionTransformationTab/DbtCloudTransformationsCard";

interface ConnectionTransformationTabProps {
  connection: WebBackendConnectionRead;
}

const Content = styled.div`
  max-width: 1073px;
  margin: 0 auto;
  padding-bottom: 10px;
`;

const NoSupportedTransformationCard = styled(Card)`
  max-width: 500px;
  margin: 0 auto;
  min-height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const CustomTransformationsCard: React.FC<{
  operations?: OperationCreate[];
  onSubmit: FormikOnSubmit<{ transformations?: OperationRead[] }>;
  mode: ConnectionFormMode;
}> = ({ operations, onSubmit, mode }) => {
  const [editingTransformation, toggleEditingTransformation] = useToggle(false);

  const initialValues = useMemo(
    () => ({
      transformations: getInitialTransformations(operations || []),
    }),
    [operations]
  );

  return (
    <FormCard<{ transformations?: OperationRead[] }>
      title={<FormattedMessage id="connection.customTransformations" />}
      collapsible
      bottomSeparator
      form={{
        initialValues,
        enableReinitialize: true,
        onSubmit,
      }}
      submitDisabled={editingTransformation}
      mode={mode}
    >
      <FieldArray name="transformations">
        {(formProps) => (
          <TransformationField
            {...formProps}
            mode={mode}
            onStartEdit={toggleEditingTransformation}
            onEndEdit={toggleEditingTransformation}
          />
        )}
      </FieldArray>
    </FormCard>
  );
};

const NormalizationCard: React.FC<{
  operations?: OperationRead[];
  onSubmit: FormikOnSubmit<{ normalization?: NormalizationType }>;
  mode: ConnectionFormMode;
}> = ({ operations, onSubmit, mode }) => {
  const initialValues = useMemo(
    () => ({
      normalization: getInitialNormalization(operations, true),
    }),
    [operations]
  );

  return (
    <FormCard<{ normalization?: NormalizationType }>
      form={{
        initialValues,
        onSubmit,
      }}
      title={<FormattedMessage id="connection.normalization" />}
      collapsible
      mode={mode}
    >
      <Field name="normalization" component={NormalizationField} mode={mode} />
    </FormCard>
  );
};

export const ConnectionTransformationTab: React.FC<ConnectionTransformationTabProps> = ({ connection }) => {
  const definition = useGetDestinationDefinitionSpecification(connection.destination.destinationDefinitionId);
  const { mutateAsync: updateConnection } = useUpdateConnection();
  const workspace = useCurrentWorkspace();

  useTrackPage(PageTrackingCodes.CONNECTIONS_ITEM_TRANSFORMATION);
  const { supportsNormalization } = definition;
  const supportsDbt = useFeature(FeatureItem.AllowCustomDBT) && definition.supportsDbt;
  const supportsCloudDbtIntegration = useFeature(FeatureItem.AllowDBTCloudIntegration) && definition.supportsDbt;
  const noSupportedTransformations = !supportsNormalization && !supportsDbt && !supportsCloudDbtIntegration;

  const mode = connection.status === ConnectionStatus.deprecated ? "readonly" : "edit";

  const onSubmit: FormikOnSubmit<{ transformations?: OperationRead[]; normalization?: NormalizationType }> = async (
    values,
    { resetForm }
  ) => {
    const newOp = mapFormPropsToOperation(values, connection.operations, workspace.workspaceId);

    const operations = values.transformations
      ? (connection.operations as OperationCreate[]) // There's an issue meshing the OperationRead here with OperationCreate that we want, in the types
          ?.filter((op) => op.operatorConfiguration.operatorType === OperatorType.normalization)
          .concat(newOp)
      : newOp.concat(
          (connection.operations ?? [])?.filter((op) => op.operatorConfiguration.operatorType === OperatorType.dbt)
        );

    await updateConnection(
      buildConnectionUpdate(connection, {
        operations,
      })
    );

    const nextFormValues: typeof values = {};
    if (values.transformations) {
      nextFormValues.transformations = getInitialTransformations(operations);
    }
    nextFormValues.normalization = getInitialNormalization(operations, true);

    resetForm({ values: nextFormValues });
  };

  return (
    <Content>
      <fieldset
        disabled={mode === "readonly"}
        style={{ border: "0", pointerEvents: `${mode === "readonly" ? "none" : "auto"}` }}
      >
        {supportsNormalization && (
          <NormalizationCard operations={connection.operations} onSubmit={onSubmit} mode={mode} />
        )}
        {supportsDbt && (
          <CustomTransformationsCard operations={connection.operations} onSubmit={onSubmit} mode={mode} />
        )}
        {supportsCloudDbtIntegration && <DbtCloudTransformationsCard connection={connection} />}
        {noSupportedTransformations && (
          <NoSupportedTransformationCard>
            <Text as="p" size="lg" centered>
              <FormattedMessage id="connectionForm.operations.notSupported" />
            </Text>
          </NoSupportedTransformationCard>
        )}
      </fieldset>
    </Content>
  );
};
