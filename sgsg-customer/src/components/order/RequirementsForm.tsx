import React from 'react';
import {
  Card,
  Space,
  TextArea,
  Checkbox,
  Tag
} from 'antd-mobile';
import {
  EditOutlined,
  WarningOutlined
} from '@ant-design/icons';

interface RequirementsFormProps {
  requirements: string;
  specialRequests: string;
  onRequirementsChange: (value: string) => void;
  onSpecialRequestsChange: (value: string) => void;
}

const RequirementsForm: React.FC<RequirementsFormProps> = ({
  requirements,
  specialRequests,
  onRequirementsChange,
  onSpecialRequestsChange
}) => {
  
  // 자주 사용되는 요구사항 템플릿
  const commonRequirements = [
    '깨끗하고 꼼꼼하게 해주세요',
    '시간 약속 잘 지켜주세요',
    '소음에 민감해요',
    '애완동물이 있어요',
    '어린아이가 있어요',
    '고령자가 계세요',
    '문 앞에 신발을 벗고 들어와 주세요',
    '마스크를 꼭 착용해 주세요'
  ];

  const handleRequirementToggle = (requirement: string) => {
    const currentRequirements = requirements ? requirements.split('\n') : [];
    
    if (currentRequirements.includes(requirement)) {
      // 제거
      const updated = currentRequirements.filter(req => req !== requirement);
      onRequirementsChange(updated.join('\n'));
    } else {
      // 추가
      const updated = [...currentRequirements, requirement].filter(req => req.trim() !== '');
      onRequirementsChange(updated.join('\n'));
    }
  };

  const isRequirementSelected = (requirement: string) => {
    return requirements.includes(requirement);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      
      {/* 기본 요구사항 */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <EditOutlined />
            서비스 요구사항
          </div>
        }
        style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px' }}>
              자주 사용되는 요구사항 (다중 선택 가능)
            </div>
            
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '8px'
            }}>
              {commonRequirements.map((requirement, index) => (
                <Tag
                  key={index}
                  color={isRequirementSelected(requirement) ? 'primary' : 'default'}
                  fill={isRequirementSelected(requirement) ? 'solid' : 'outline'}
                  onClick={() => handleRequirementToggle(requirement)}
                  style={{ 
                    cursor: 'pointer',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                >
                  {requirement}
                </Tag>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
              추가 요구사항을 직접 입력해주세요
            </div>
            <TextArea
              placeholder="전문가에게 전달하고 싶은 요구사항이 있다면 자세히 적어주세요.&#10;&#10;예시:&#10;- 특별히 관리가 필요한 부분이 있어요&#10;- 사용하면 안 되는 제품이나 도구가 있어요&#10;- 서비스 시간에 대한 특별한 요청이 있어요"
              value={requirements}
              onChange={onRequirementsChange}
              rows={4}
              maxLength={500}
              showCount
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </div>

        </Space>
      </Card>

      {/* 특별 요청사항 */}
      <Card 
        title="특별 요청사항"
        style={{ border: '1px solid #f0f0f0', borderRadius: '12px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          
          <div style={{ fontSize: '14px', color: '#8c8c8c', lineHeight: '1.5' }}>
            영수증 발급, 추가 서비스, 시간 조정 등의 특별한 요청사항이 있다면 적어주세요.
          </div>

          <TextArea
            placeholder="특별 요청사항을 입력해주세요.&#10;&#10;예시:&#10;- 세금계산서 발급이 필요해요&#10;- 추가로 OO 서비스도 가능한지 문의드려요&#10;- 시간을 30분 정도 더 여유있게 잡아주세요"
            value={specialRequests}
            onChange={onSpecialRequestsChange}
            rows={3}
            maxLength={300}
            showCount
            autoSize={{ minRows: 2, maxRows: 4 }}
          />

        </Space>
      </Card>

      {/* 주의사항 */}
      <Card 
        style={{ 
          background: '#fff2e8',
          border: '1px solid #ffbb96',
          borderRadius: '8px'
        }}
      >
        <Space align="start">
          <WarningOutlined style={{ color: '#fa541c', fontSize: '16px', marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#fa541c', marginBottom: '8px' }}>
              요구사항 작성 시 참고사항
            </div>
            <div style={{ fontSize: '12px', color: '#ad4e00', lineHeight: '1.5' }}>
              • 구체적이고 명확하게 작성해주시면 더 만족스러운 서비스를 받으실 수 있어요<br/>
              • 전문가와 상담 과정에서 추가 논의가 필요할 수 있어요<br/>
              • 과도한 요구사항은 추가 비용이 발생할 수 있어요<br/>
              • 전문가의 안전과 관련된 요청은 거절될 수 있어요
            </div>
          </div>
        </Space>
      </Card>

      {/* 개인정보 동의 */}
      <Card style={{ border: '1px solid #f0f0f0', borderRadius: '8px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Checkbox>
            <span style={{ fontSize: '14px' }}>
              전문가에게 요구사항 정보 전달에 동의합니다
            </span>
          </Checkbox>
          <div style={{ fontSize: '12px', color: '#8c8c8c', paddingLeft: '24px' }}>
            더 나은 서비스 제공을 위해 전문가에게 요구사항이 전달됩니다
          </div>
        </Space>
      </Card>

    </Space>
  );
};

export default RequirementsForm;