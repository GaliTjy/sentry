import LazyLoad from 'react-lazyload';

import MiniBarChart from 'sentry/components/charts/miniBarChart';
import {t} from 'sentry/locale';
import {Group, TimeseriesValue} from 'sentry/types';
import {Series} from 'sentry/types/echarts';
import theme from 'sentry/utils/theme';

type Props = {
  statsPeriod: string;
  data: Group;
  height?: number;
  showSecondaryPoints?: boolean;
};

function GroupChart({
  data,
  statsPeriod,
  showSecondaryPoints = false,
  height = 24,
}: Props) {
  const stats: TimeseriesValue[] = statsPeriod
    ? data.filtered
      ? data.filtered.stats[statsPeriod]
      : data.stats[statsPeriod]
    : [];

  const secondaryStats: TimeseriesValue[] | null =
    statsPeriod && data.filtered ? data.stats[statsPeriod] : null;

  if (!stats || !stats.length) {
    return null;
  }

  let colors: string[] | undefined = undefined;
  let emphasisColors: string[] | undefined = undefined;

  const series: Series[] = [];
  if (showSecondaryPoints && secondaryStats && secondaryStats.length) {
    series.push({
      seriesName: t('Total Events'),
      data: secondaryStats.map(point => ({name: point[0] * 1000, value: point[1]})),
    });
    series.push({
      seriesName: t('Matching Events'),
      data: stats.map(point => ({name: point[0] * 1000, value: point[1]})),
    });
  } else {
    // Colors are custom to preserve historical appearance where the single series is
    // considerably darker than the two series results.
    colors = [theme.gray300];
    emphasisColors = [theme.purple300];
    series.push({
      seriesName: t('Events'),
      data: stats.map(point => ({name: point[0] * 1000, value: point[1]})),
    });
  }

  return (
    <LazyLoad debounce={50} height={height}>
      <MiniBarChart
        height={height}
        isGroupedByDate
        showTimeInTooltip
        series={series}
        colors={colors}
        emphasisColors={emphasisColors}
        hideDelay={50}
      />
    </LazyLoad>
  );
}

export default GroupChart;
