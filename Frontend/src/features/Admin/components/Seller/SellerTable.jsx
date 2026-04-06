import Avatar from "../common/Avatar";
import StatusBadge from "../common/StatusBadge";
import PlanBadge from "../common/PlanBadge";

const SellerTable = ({ sellers, onSelect, onAction }) => {
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Seller</th>
          <th>Plan</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {sellers.map((s) => (
          <tr key={s.subscriptionId} onClick={() => onSelect(s)}>
            <td>
              <div className="flex gap-2">
                <Avatar name={s.seller.name} />
                {s.seller.name}
              </div>
            </td>

            <td>
              <PlanBadge plan={s.subscription.plan} />
            </td>

            <td>
              <StatusBadge status={s.seller.accountStatus} />
            </td>

            <td onClick={(e) => e.stopPropagation()}>
              <button onClick={() => onAction("pause", s)}>Pause</button>
              <button onClick={() => onAction("ban", s)}>Ban</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default SellerTable;