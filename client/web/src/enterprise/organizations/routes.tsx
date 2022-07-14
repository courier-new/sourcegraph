import { RouteComponentProps } from 'react-router'

import { lazyComponent } from '@sourcegraph/shared/src/util/lazyComponent'

import { OrgAreaPageProps, OrgAreaRoute } from '../../org/area/OrgArea'
import { orgAreaRoutes } from '../../org/area/routes'
import { enterpriseNamespaceAreaRoutes } from '../namespaces/routes'

const NamespaceBatchChangesArea = lazyComponent(
    () => import('../batches/global/GlobalBatchChangesArea'),
    'NamespaceBatchChangesArea'
)

const ExecuteBatchSpecPage = lazyComponent(
    () => import('../batches/batch-spec/execute/ExecuteBatchSpecPage'),
    'ExecuteBatchSpecPage'
)

const CreateBatchChangePage = lazyComponent(
    () => import('../batches/create/CreateBatchChangePage'),
    'CreateBatchChangePage'
)

const EditBatchSpecPage = lazyComponent(
    () => import('../batches/batch-spec/edit/EditBatchSpecPage'),
    'EditBatchSpecPage'
)

export const enterpriseOrganizationAreaRoutes: readonly OrgAreaRoute[] = [
    ...orgAreaRoutes,
    ...enterpriseNamespaceAreaRoutes,
    {
        path: '/batch-changes/create',
        render: props => <CreateBatchChangePage headingElement="h1" {...props} initialNamespaceID={props.org.id} />,
        condition: ({ batchChangesEnabled }) => batchChangesEnabled,
        fullPage: true,
    },
    {
        path: '/batch-changes/:batchChangeName/edit',
        render: ({ match, ...props }: OrgAreaPageProps & RouteComponentProps<{ batchChangeName: string }>) => (
            <EditBatchSpecPage
                {...props}
                batchChange={{ name: match.params.batchChangeName, namespace: props.org.id }}
            />
        ),
        condition: ({ batchChangesEnabled, batchChangesExecutionEnabled }) =>
            batchChangesEnabled && batchChangesExecutionEnabled,
        fullPage: true,
    },
    {
        path: '/batch-changes/:batchChangeName/executions/:batchSpecID',
        render: ({
            match,
            ...props
        }: OrgAreaPageProps & RouteComponentProps<{ batchChangeName: string; batchSpecID: string }>) => (
            <ExecuteBatchSpecPage
                {...props}
                batchSpecID={match.params.batchSpecID}
                batchChange={{ name: match.params.batchChangeName, namespace: props.org.id }}
                match={match}
            />
        ),
        condition: ({ batchChangesEnabled, batchChangesExecutionEnabled }) =>
            batchChangesEnabled && batchChangesExecutionEnabled,
        fullPage: true,
    },
    {
        path: '/batch-changes',
        render: props => <NamespaceBatchChangesArea {...props} namespaceID={props.org.id} />,
        condition: ({ batchChangesEnabled }) => batchChangesEnabled,
    },
]
