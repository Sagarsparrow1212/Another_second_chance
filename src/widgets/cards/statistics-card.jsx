import React from "react";
import PropTypes from "prop-types";

export function StatisticsCard({ color, icon, title, value, footer, trend, description }) {
  // Refined enterprise palette mapping
  const colorStyles = {
    blue: {
      iconBg: "bg-enterprise-softBlue text-[#2878E5] border border-[#2878E5]/20",
      accent: "bg-[#2878E5]",
    },
    green: {
      iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-200/60",
      accent: "bg-emerald-500",
    },
    amber: {
      iconBg: "bg-amber-50 text-amber-600 border border-amber-200/60",
      accent: "bg-amber-500",
    },
    red: {
      iconBg: "bg-rose-50 text-rose-600 border border-rose-200/60",
      accent: "bg-rose-500",
    },
    purple: {
      iconBg: "bg-purple-50 text-purple-600 border border-purple-200/60",
      accent: "bg-purple-500",
    },
    navy: {
      iconBg: "bg-slate-100 text-enterprise-navy border border-slate-200",
      accent: "bg-enterprise-navy",
    },
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div className="relative rounded-xl bg-white border border-[#E7ECF2] p-5 shadow-card hover:shadow-elevated transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-enterprise-muted mb-1.5">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-enterprise-textPrimary tracking-tight">
            {value}
          </h3>
          {description && (
            <p className="text-xs text-enterprise-textSecondary mt-1">
              {description}
            </p>
          )}
        </div>

        {/* Enterprise icon badge */}
        <div className={`p-2.5 rounded-lg flex items-center justify-center ${style.iconBg} transition-transform duration-200 group-hover:scale-105`}>
          {icon}
        </div>
      </div>

      {footer && (
        <div className="mt-3 pt-3 border-t border-[#E7ECF2]/80 text-xs text-enterprise-textSecondary">
          {footer}
        </div>
      )}
    </div>
  );
}

StatisticsCard.defaultProps = {
  color: "blue",
  footer: null,
};

StatisticsCard.propTypes = {
  color: PropTypes.oneOf([
    "blue",
    "green",
    "amber",
    "red",
    "purple",
    "navy",
  ]),
  icon: PropTypes.node.isRequired,
  title: PropTypes.node.isRequired,
  value: PropTypes.node.isRequired,
  footer: PropTypes.node,
  trend: PropTypes.string,
  description: PropTypes.string,
};

export default StatisticsCard;
