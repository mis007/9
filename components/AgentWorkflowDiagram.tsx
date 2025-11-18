import React from 'react';
import { Agent, AgentColorClasses } from '../types';
import { Icon } from './common/Icon';

const agentData: Record<'A' | 'B' | 'C' | 'D', Pick<Agent, 'id' | 'icon' | 'name'> & { colorClasses: AgentColorClasses }> = {
  A: { id: 'A', name: '乡村导览前台', icon: 'user', colorClasses: { iconBg: 'bg-yellow-500' } as AgentColorClasses },
  B: { id: 'B', name: '文化讲解员', icon: 'academic-cap', colorClasses: { iconBg: 'bg-green-500' } as AgentColorClasses },
  C: { id: 'C', name: '特产推荐员', icon: 'bag', colorClasses: { iconBg: 'bg-orange-500' } as AgentColorClasses },
  D: { id: 'D', name: '数据管家', icon: 'document-chart-bar', colorClasses: { iconBg: 'bg-blue-500' } as AgentColorClasses },
};

interface WorkflowStep {
  agentId: 'A' | 'B' | 'C' | 'D';
  action: string;
  painPoint: string;
  tech: string;
}

const workflowSteps: WorkflowStep[] = [
  { agentId: 'A', action: '匹配景点', painPoint: '解决“找景点难”', tech: 'ANP协议' },
  { agentId: 'B', action: '识别与讲解', painPoint: '实现“深度讲解”', tech: 'Minimax VLM' },
  { agentId: 'C', action: '推荐附近特产', painPoint: '实现“智能导购”', tech: '本地文件解析' },
  { agentId: 'D', action: '生成专属纪念册', painPoint: '记录“美好回忆”', tech: 'Redis存储' },
];

const WorkflowArrow: React.FC = () => (
  <div className="relative flex-1 flex items-center justify-center h-full min-w-[2rem] md:min-w-[4rem]">
    <div className="absolute w-full h-0.5 bg-gray-300"></div>
    <div className="absolute w-full flex justify-center">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-dot"></div>
    </div>
    <div className="absolute right-[-2px] text-gray-400 text-2xl">&rsaquo;</div>
  </div>
);

const AgentWorkflowDiagram: React.FC = () => {
  return (
    <div className="bg-amber-50/50 border-2 border-dashed border-amber-300 rounded-xl p-4 shadow-sm">
      <h3 className="font-bold text-lg text-center text-amber-800 mb-1">AI团队协同服务流程</h3>
      <p className="text-center text-amber-700/80 mb-4 text-xs">“多智能体”为您提供一站式智慧导览服务</p>

      <div className="flex items-start justify-between space-x-1 md:space-x-2">
        {workflowSteps.map((step, index) => {
          const agent = agentData[step.agentId];
          return (
            <React.Fragment key={step.agentId}>
              <div className="flex flex-col items-center text-center w-1/4">
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center ${agent.colorClasses.iconBg} shadow-lg`}>
                  <Icon name={agent.icon} className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <p className="font-bold text-gray-700 text-sm mt-2">{step.action}</p>
                <p className="text-xs text-gray-500 leading-tight mt-1">{step.painPoint}</p>
                <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full mt-2">{step.tech}</span>
              </div>
              {index < workflowSteps.length - 1 && <WorkflowArrow />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default AgentWorkflowDiagram;
