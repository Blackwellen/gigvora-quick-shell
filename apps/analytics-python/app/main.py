"""Gigvora analytics service: dashboard summaries, forecasts, anomaly commentary."""
from fastapi import FastAPI
from pydantic import BaseModel, ConfigDict, Field
import statistics
from ._obs import install_observability, payload_guard, track
from .shell import router as shell_router
from .marketing import router as marketing_router
from .identity import router as identity_router
from .entitlements import router as entitlements_router
from .search import router as search_router
from .overlays import router as overlays_router
from .notifications import router as notifications_router
from .settings import router as settings_router
from .feed import router as feed_router
from .network import router as network_router
from .profiles import router as profiles_router
from .companies import router as companies_router
from .agency import router as agency_router
from .groups import router as groups_router
from .events import router as events_router
from .trust import router as trust_router
from .inbox import router as inbox_router
from .calls import router as calls_router
from .booking import router as booking_router
from .media import router as media_router
from .podcasts import router as podcasts_router
from .jobs_browse import router as jobs_browse_router
from .webinars import router as webinars_router
from .jobs_studio import router as jobs_studio_router
from .job_applications import router as job_applications_router
from .recruiter_jobs import router as recruiter_jobs_router
from .interview_planning import router as interview_planning_router
from .proposal_review_award import router as proposal_review_award_router
from .contracts_sow_acceptance import router as contracts_sow_acceptance_router
from .project_workspaces_handover import router as project_workspaces_handover_router
from .calendar import router as calendar_router
from .seller_performance_availability import router as seller_performance_router
from .user_dashboard import router as user_dashboard_router
from .client_dashboard import router as client_dashboard_router
from .recruiter_dashboard import router as recruiter_dashboard_router
from .agency_management_dashboard import router as agency_management_dashboard_router
from .enterprise_dashboard import router as enterprise_dashboard_router
from .org_members_seats import router as org_members_seats_router
from .shared_workspaces_collaboration import router as shared_workspaces_collaboration_router
from .resource_planning_utilization import router as resource_planning_utilization_router
from .wallet_credits_packages import router as wallet_credits_packages_router
from .billing_invoices_tax import router as billing_invoices_tax_router
from .payouts_escrow_finops import router as payouts_escrow_finops_router
from .ads_manager_builder import router as ads_manager_builder_router
from .ads_analytics_performance import router as ads_analytics_performance_router
from .map_views_geo_intel import router as map_views_geo_intel_router
from .donations_purchases_commerce import router as donations_purchases_commerce_router
from .pricing_promotions_monetization import router as pricing_promotions_monetization_router
from .internal_admin_login_terminal import router as internal_admin_login_terminal_router
from .internal_admin_shell import router as internal_admin_shell_router
from .customer_service import router as customer_service_router
from .finance_admin import router as finance_admin_router
from .dispute_ops import router as dispute_ops_router
from .moderator_dashboard import router as moderator_dashboard_router
from .trust_safety_ml import router as trust_safety_ml_router
from .ads_ops import router as ads_ops_router
from .verification_compliance import router as verification_compliance_router
from .super_admin_command_center import router as super_admin_command_center_router
from .enterprise_connect import router as enterprise_connect_router
from .networking_events_groups import router as networking_events_groups_router
from .sales_navigator import router as sales_navigator_router
from .launchpad_studio_tasks_team import router as launchpad_studio_tasks_team_router

app = FastAPI(title="Gigvora Analytics", version="0.1.0")
install_observability(app)
app.include_router(shell_router)
app.include_router(marketing_router)
app.include_router(identity_router)
app.include_router(entitlements_router)
app.include_router(search_router)
app.include_router(overlays_router)
app.include_router(notifications_router)
app.include_router(settings_router)
app.include_router(feed_router)
app.include_router(network_router)
app.include_router(profiles_router)
app.include_router(companies_router)
app.include_router(agency_router)
app.include_router(groups_router)
app.include_router(events_router)
app.include_router(trust_router)
app.include_router(inbox_router)
app.include_router(calls_router)
app.include_router(booking_router)
app.include_router(media_router)
app.include_router(podcasts_router)
app.include_router(jobs_browse_router)
app.include_router(webinars_router)
app.include_router(jobs_studio_router)
app.include_router(job_applications_router)
app.include_router(recruiter_jobs_router)
app.include_router(interview_planning_router)
app.include_router(proposal_review_award_router)
app.include_router(contracts_sow_acceptance_router)
app.include_router(project_workspaces_handover_router)
app.include_router(calendar_router)
app.include_router(seller_performance_router)
app.include_router(user_dashboard_router)
app.include_router(client_dashboard_router)
app.include_router(recruiter_dashboard_router)
app.include_router(agency_management_dashboard_router)
app.include_router(enterprise_dashboard_router)
app.include_router(org_members_seats_router)
app.include_router(shared_workspaces_collaboration_router)
app.include_router(resource_planning_utilization_router)
app.include_router(wallet_credits_packages_router)
app.include_router(billing_invoices_tax_router)
app.include_router(payouts_escrow_finops_router)
app.include_router(ads_manager_builder_router)
app.include_router(ads_analytics_performance_router)
app.include_router(map_views_geo_intel_router)
app.include_router(donations_purchases_commerce_router)
app.include_router(pricing_promotions_monetization_router)
app.include_router(internal_admin_login_terminal_router)
app.include_router(internal_admin_shell_router)
app.include_router(customer_service_router)
app.include_router(finance_admin_router)
app.include_router(dispute_ops_router)
app.include_router(moderator_dashboard_router)
app.include_router(trust_safety_ml_router)
app.include_router(ads_ops_router)
app.include_router(verification_compliance_router)
app.include_router(super_admin_command_center_router)
app.include_router(enterprise_connect_router)
app.include_router(networking_events_groups_router)
app.include_router(sales_navigator_router)


class SummaryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    metric: str = Field(min_length=1, max_length=128)
    series: list[float] = Field(default_factory=list)


class ForecastRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    series: list[float] = Field(default_factory=list)
    horizon: int = Field(default=7, ge=1, le=365)


@app.get("/health")
def health(): return {"status": "ok", "service": "analytics"}


@app.post("/summary")
def summary(req: SummaryRequest):
    with track("summary"):
        payload_guard(items=req.series)
        if not req.series:
            return {"metric": req.metric, "summary": "no data"}
        return {
            "metric": req.metric,
            "n": len(req.series),
            "mean": round(statistics.mean(req.series), 4),
            "median": round(statistics.median(req.series), 4),
            "stdev": round(statistics.pstdev(req.series), 4) if len(req.series) > 1 else 0,
            "min": min(req.series), "max": max(req.series),
        }


@app.post("/forecast")
def forecast(req: ForecastRequest):
    with track("forecast"):
        payload_guard(items=req.series)
        if not req.series:
            return {"forecast": [0.0] * req.horizon}
        last = req.series[-1]
        drift = (req.series[-1] - req.series[0]) / max(1, len(req.series) - 1)
        return {"forecast": [round(last + drift * (i + 1), 4) for i in range(req.horizon)]}
