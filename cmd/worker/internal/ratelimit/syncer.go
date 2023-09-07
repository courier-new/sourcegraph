package ratelimit

import (
	"context"
	"time"

	"golang.org/x/time/rate"

	"github.com/sourcegraph/sourcegraph/internal/database"
	"github.com/sourcegraph/sourcegraph/internal/extsvc"
	"github.com/sourcegraph/sourcegraph/internal/ratelimit"
	"github.com/sourcegraph/sourcegraph/internal/types"
	"github.com/sourcegraph/sourcegraph/lib/errors"
)

type externalServiceLister interface {
	List(context.Context, database.ExternalServicesListOptions) ([]*types.ExternalService, error)
}

// SyncServices syncs a know slice of external services with their rate limiters without
// fetching them from the database.
func SyncServices(ctx context.Context, services []*types.ExternalService) error {
	var errs error
	for _, svc := range services {
		limit, err := extsvc.ExtractEncryptableRateLimit(ctx, svc.Config, svc.Kind)
		if err != nil {
			if errors.HasType(err, extsvc.ErrRateLimitUnsupported{}) {
				continue
			}
			errs = errors.Append(errs, errors.Wrap(err, "getting rate limit configuration"))
			continue
		}

		l := ratelimit.NewGlobalRateLimiter(svc.URN())
		lim := int32(-1)
		// rate.Inf should be stored as -1.
		if limit != rate.Inf {
			lim = int32(limit * 3600)
		}
		if err := l.SetTokenBucketConfig(ctx, lim, time.Hour); err != nil {
			errs = errors.Append(errs, err)
			continue
		}
	}
	return errs
}
