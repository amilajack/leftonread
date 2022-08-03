import { ArrowForwardIcon, Icon } from '@chakra-ui/icons';
import { Button, Text } from '@chakra-ui/react';
import { ipcRenderer } from 'electron';
import { useState } from 'react';
import { IconType } from 'react-icons';
import { FiBarChart2, FiGlobe, FiLock } from 'react-icons/fi';

function BulletPoint({
  icon,
  title,
  description,
  color,
}: {
  icon: IconType;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div style={{ display: 'flex', marginBottom: 32 }}>
      <div style={{ marginRight: '8px' }}>
        <Icon
          as={icon}
          color={color}
          w={{ lg: 6, xl: 7 }}
          h={{ lg: 6, xl: 7 }}
        />
      </div>
      <div>
        <Text
          color="black"
          fontWeight="bold"
          fontSize={{ lg: 'lg', xl: '2xl' }}
        >
          {title}
        </Text>
        <Text fontSize={{ lg: 'sm', xl: 'lg' }} color="gray">
          {description}
        </Text>
      </div>
    </div>
  );
}

export function GetStarted({ onNext }: { onNext: (arg0: boolean) => void }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onStart = async () => {
    setIsLoading(true);
    const hasAccess = await ipcRenderer.invoke('check-permissions');
    onNext(true);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <BulletPoint
        icon={FiBarChart2}
        title="Learn about your habits"
        description={`We render graphs about your text messages, 
so you can feel better about your relationship 
with your phone.`}
        color="blue.400"
      />
      <BulletPoint
        icon={FiLock}
        title="Runs Offline"
        description="Privacy and security is our number one priority. That’s why we designed the platform to completely run offline."
        color="blue.400"
      />
      <BulletPoint
        icon={FiGlobe}
        title="Open Source"
        description="We believe in transparency and community, which is why all of our code is public."
        color="blue.400"
      />
      <Button
        style={{ marginTop: 32 }}
        rightIcon={<ArrowForwardIcon />}
        colorScheme="purple"
        onClick={() => {
          onStart();
        }}
        shadow="xl"
        isLoading={isLoading}
      >
        Get Started
      </Button>
    </div>
  );
}