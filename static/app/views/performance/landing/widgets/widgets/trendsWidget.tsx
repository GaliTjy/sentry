import {Fragment, FunctionComponent, useMemo} from 'react';
import {withRouter} from 'react-router';
import {withTheme} from '@emotion/react';
import styled from '@emotion/styled';
import {Location} from 'history';
import omit from 'lodash/omit';

import _EventsRequest from 'app/components/charts/eventsRequest';
import {t} from 'app/locale';
import {Organization} from 'app/types';
import EventView from 'app/utils/discover/eventView';
import TrendsDiscoverQuery from 'app/utils/performance/trends/trendsDiscoverQuery';
import withApi from 'app/utils/withApi';
import withProjects from 'app/utils/withProjects';
import _DurationChart from 'app/views/performance/charts/chart';

import {TrendsListItem} from '../../../trends/changedTransactions';
import {Chart} from '../../../trends/chart';
import {TrendChangeType} from '../../../trends/types';
import {getCurrentTrendFunction, getSelectedTransaction} from '../../../trends/utils';
import {GenericPerformanceWidget} from '../components/performanceWidget';
import {transformTrendsDiscover} from '../transforms/transformTrendsDiscover';
import {WidgetDataResult} from '../types';

type Props = {
  title: string;
  titleTooltip: string;
  fields: string[];
  chartColor?: string;

  eventView: EventView;
  location: Location;
  organization: Organization;

  trendChangeType: TrendChangeType;

  ContainerActions: FunctionComponent<{isLoading: boolean}>;
};

type TrendsWidgetDataType = {
  chart: WidgetDataResult & ReturnType<typeof transformTrendsDiscover>;
};

export function TrendsWidget(props: Props) {
  const {
    eventView: _eventView,
    location,
    organization,
    trendChangeType,
    ContainerActions,
  } = props;
  const eventView = _eventView.clone();
  const fields = [{field: 'transaction'}, {field: 'project'}];
  eventView.fields = fields;
  eventView.sorts = [
    {
      kind: trendChangeType === TrendChangeType.IMPROVED ? 'asc' : 'desc',
      field: 'trend_percentage()',
    },
  ];
  const rest = {eventView, ...omit(props, 'eventView')};
  eventView.additionalConditions.addFilterValues('tpm()', ['>0.01']);
  eventView.additionalConditions.addFilterValues('count_percentage()', ['>0.25', '<4']);
  eventView.additionalConditions.addFilterValues('trend_percentage()', ['>0%']);
  eventView.additionalConditions.addFilterValues('confidence()', ['>6']);
  eventView.additionalConditions.removeFilter('transaction.op'); // Get rid of pageload for testing.

  const trendFunction = getCurrentTrendFunction(location);

  const Queries = useMemo(() => {
    const queryProps = {...omit(rest, 'fields'), orgSlug: organization.slug};
    return {
      chart: {
        fields: ['transaction', 'project'],
        component: provided => (
          <TrendsDiscoverQuery
            {...queryProps}
            {...provided}
            eventView={eventView}
            location={props.location}
            trendChangeType={props.trendChangeType}
            limit={3}
          />
        ),
        transform: transformTrendsDiscover,
      },
    };
  }, [fields, eventView, props.trendChangeType]);

  return (
    <GenericPerformanceWidget<TrendsWidgetDataType>
      {...rest}
      subtitle={<Subtitle>{t('Trending Transactions')}</Subtitle>}
      HeaderActions={provided => <ContainerActions {...provided.widgetData.chart} />}
      Queries={Queries}
      Visualizations={[
        {
          component: provided => (
            <TrendsChart
              {...provided}
              {...rest}
              isLoading={provided.widgetData.chart.isLoading}
              statsData={provided.widgetData.chart.statsData}
              query={eventView.query}
              project={eventView.project}
              environment={eventView.environment}
              start={eventView.start}
              end={eventView.end}
              statsPeriod={eventView.statsPeriod}
              transaction={getSelectedTransaction(
                location,
                trendChangeType,
                provided.widgetData.chart.events
              )}
            />
          ),
          bottomPadding: true,
          height: 160,
        },
        {
          noPadding: true,
          component: provided => {
            // const transaction = getSelectedTransaction(
            //   location,
            //   trendChangeType,
            //   provided.events
            // );
            const transactionsList = provided.widgetData.chart?.transactionsList;

            return (
              <Fragment>
                {(transactionsList ?? []).map((transaction, index) => (
                  <ListItem
                    currentTrendFunction={trendFunction.field}
                    currentTrendColumn={trendFunction.alias}
                    trendView={eventView}
                    organization={organization}
                    transaction={transaction}
                    key={transaction.transaction}
                    index={index}
                    trendChangeType={trendChangeType}
                    transactions={transactionsList}
                    location={location}
                    statsData={provided.widgetData.chart.statsData}
                    handleSelectTransaction={() => {}}
                  />
                ))}
              </Fragment>
            );
          },
          height: 160,
        },
      ]}
    />
  );
}

const TrendsChart = withProjects(withRouter(withApi(withTheme(Chart))));
const ListItem = withProjects(withApi(TrendsListItem));
const Subtitle = styled('span')`
  color: ${p => p.theme.gray300};
  font-size: ${p => p.theme.fontSizeMedium};
`;