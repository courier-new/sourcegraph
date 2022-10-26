package background

import (
	"time"

	"github.com/sourcegraph/sourcegraph/internal/workerutil/dbworker"
)

// NewIndexResetter returns a background routine that periodically resets index
// records that are marked as being processed but are no longer being processed
// by a worker.
func (b backgroundJob) NewIndexResetter(interval time.Duration) *dbworker.Resetter {
	return dbworker.NewResetter(b.logger, b.workerutilStore, dbworker.ResetterOptions{
		Name:     "precise_code_intel_index_worker_resetter",
		Interval: interval,
		Metrics: dbworker.ResetterMetrics{
			RecordResets:        b.resetterMetrics.numIndexResets,
			RecordResetFailures: b.resetterMetrics.numIndexResetFailures,
			Errors:              b.resetterMetrics.numIndexResetErrors,
		},
	})
}

// NewDependencyIndexResetter returns a background routine that periodically resets
// dependency index records that are marked as being processed but are no longer being
// processed by a worker.
func (b backgroundJob) NewDependencyIndexResetter(interval time.Duration) *dbworker.Resetter {
	return dbworker.NewResetter(b.logger, b.dependencyIndexingStore, dbworker.ResetterOptions{
		Name:     "precise_code_intel_dependency_index_worker_resetter",
		Interval: interval,
		Metrics: dbworker.ResetterMetrics{
			RecordResets:        b.resetterMetrics.numDependencyIndexResets,
			RecordResetFailures: b.resetterMetrics.numDependencyIndexResetFailures,
			Errors:              b.resetterMetrics.numDependencyIndexResetErrors,
		},
	})
}
