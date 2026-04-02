import { useSubscriptionContext } from "../context/subscription.context";

/**
 * useSubscription
 *
 * Returns everything from SubscriptionContext:
 *   plans, subscription, loading, error, successMsg
 *   fetchPlans, subscribePlan, fetchMySubscription, upgrade, clearMessages
 *
 * Usage:
 *   const { plans, fetchPlans, subscribePlan, loading } = useSubscription();
 */
export const useSubscription = () => useSubscriptionContext();