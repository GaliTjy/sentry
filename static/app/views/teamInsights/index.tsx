import {Fragment, useState} from 'react';
import {RouteComponentProps} from 'react-router';
import styled from '@emotion/styled';
import {LocationDescriptorObject} from 'history';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import moment from 'moment';

import {Client} from 'app/api';
import {DateTimeObject} from 'app/components/charts/utils';
import * as Layout from 'app/components/layouts/thirds';
import Link from 'app/components/links/link';
import LoadingIndicator from 'app/components/loadingIndicator';
import {getParams} from 'app/components/organizations/globalSelectionHeader/getParams';
import {ChangeData} from 'app/components/organizations/timeRangeSelector';
import PageTimeRangeSelector from 'app/components/pageTimeRangeSelector';
import {DEFAULT_RELATIVE_PERIODS, DEFAULT_STATS_PERIOD} from 'app/constants';
import {t} from 'app/locale';
import space from 'app/styles/space';
import {DateString, Organization, RelativePeriod, TeamWithProjects} from 'app/types';
import withApi from 'app/utils/withApi';
import withOrganization from 'app/utils/withOrganization';
import withTeamsForUser from 'app/utils/withTeamsForUser';

import TeamKeyTransactions from './keyTransactions';
import TeamDropdown from './teamDropdown';

type Props = {
  api: Client;
  organization: Organization;
  teams: TeamWithProjects[];
  loadingTeams: boolean;
  error: Error | null;
} & RouteComponentProps<{orgId: string}, {}>;

const PAGE_QUERY_PARAMS = [
  'pageStatsPeriod',
  'pageStart',
  'pageEnd',
  'pageUtc',
  'dataCategory',
  'transform',
  'sort',
  'query',
  'cursor',
];

function TeamInsightsContainer({
  organization,
  teams,
  loadingTeams,
  location,
  router,
}: Props) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const currentTeamId = selectedTeam ?? teams[0]?.id;
  const currentTeam = teams.find(team => team.id === currentTeamId);
  const projects = currentTeam?.projects ?? [];

  function handleUpdateDatetime(datetime: ChangeData): LocationDescriptorObject {
    const {start, end, relative, utc} = datetime;

    if (start && end) {
      const parser = utc ? moment.utc : moment;

      return setStateOnUrl({
        pageStatsPeriod: undefined,
        pageStart: parser(start).format(),
        pageEnd: parser(end).format(),
        pageUtc: utc ?? undefined,
      });
    }

    return setStateOnUrl({
      pageStatsPeriod: (relative as RelativePeriod) || undefined,
      pageStart: undefined,
      pageEnd: undefined,
      pageUtc: undefined,
    });
  }

  function setStateOnUrl(nextState: {
    pageStatsPeriod?: RelativePeriod;
    pageStart?: DateString;
    pageEnd?: DateString;
    pageUtc?: boolean | null;
    sort?: string;
    query?: string;
    cursor?: string;
  }): LocationDescriptorObject {
    const nextQueryParams = pick(nextState, PAGE_QUERY_PARAMS);

    const nextLocation = {
      ...location,
      query: {
        ...location?.query,
        ...nextQueryParams,
      },
    };

    router.push(nextLocation);

    return nextLocation;
  }

  function dataDatetime(): DateTimeObject {
    const query = location?.query ?? {};

    const {
      start,
      end,
      statsPeriod,
      utc: utcString,
    } = getParams(query, {
      allowEmptyPeriod: true,
      allowAbsoluteDatetime: true,
      allowAbsolutePageDatetime: true,
    });

    if (!statsPeriod && !start && !end) {
      return {period: DEFAULT_STATS_PERIOD};
    }

    // Following getParams, statsPeriod will take priority over start/end
    if (statsPeriod) {
      return {period: statsPeriod};
    }

    const utc = utcString === 'true';
    if (start && end) {
      return utc
        ? {
            start: moment.utc(start).format(),
            end: moment.utc(end).format(),
            utc,
          }
        : {
            start: moment(start).utc().format(),
            end: moment(end).utc().format(),
            utc,
          };
    }

    return {period: DEFAULT_STATS_PERIOD};
  }
  const {period, start, end, utc} = dataDatetime();

  return (
    <Fragment>
      <BorderlessHeader>
        <StyledHeaderContent>
          <StyledLayoutTitle>{t('Team Insights')}</StyledLayoutTitle>
        </StyledHeaderContent>
      </BorderlessHeader>
      <Layout.Header>
        <Layout.HeaderNavTabs underlined>
          <li>
            <Link to={`/organizations/${organization.slug}/projects/`}>
              {t('Projects Overview')}
            </Link>
          </li>
          <li className="active">
            <Link to={`/organizations/${organization.slug}/teamInsights/`}>
              {t('Team Insights')}
            </Link>
          </li>
        </Layout.HeaderNavTabs>
      </Layout.Header>

      <Layout.Body>
        {loadingTeams && <LoadingIndicator />}
        {!loadingTeams && (
          <LayoutMain fullWidth>
            <ControlsWrapper>
              <TeamDropdown
                teams={teams}
                selectedTeam={currentTeamId}
                handleChangeFilter={selectedTeams =>
                  setSelectedTeam([...selectedTeams][0])
                }
              />
              <PageTimeRangeSelector
                organization={organization}
                relative={period ?? ''}
                start={start ?? null}
                end={end ?? null}
                utc={utc ?? null}
                onUpdate={handleUpdateDatetime}
                relativeOptions={omit(DEFAULT_RELATIVE_PERIODS, ['1h'])}
              />
            </ControlsWrapper>

            <Layout.Title>{t('Performance')}</Layout.Title>
            <TeamKeyTransactions
              organization={organization}
              projects={projects}
              period={period}
              start={start?.toString()}
              end={end?.toString()}
              location={location}
            />
          </LayoutMain>
        )}
      </Layout.Body>
    </Fragment>
  );
}

export default withApi(withOrganization(withTeamsForUser(TeamInsightsContainer)));

const BorderlessHeader = styled(Layout.Header)`
  border-bottom: 0;
`;

const StyledHeaderContent = styled(Layout.HeaderContent)`
  margin-bottom: 0;
`;

const LayoutMain = styled(Layout.Main)`
  display: grid;
  gap: ${space(2)};
`;

const StyledLayoutTitle = styled(Layout.Title)`
  margin-top: ${space(0.5)};
`;

const ControlsWrapper = styled('div')`
  display: flex;
  align-items: center;
  gap: ${space(1)};
`;