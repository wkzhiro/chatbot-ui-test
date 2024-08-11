import { FC, useContext, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { DEFAULT_TEMPERATURE } from '@/utils/app/const';
import HomeContext from '@/pages/api/home/home.context';

interface Props {
  label: string;
  onChangeTemperature: (temperature: number) => void;
}

export const TemperatureSlider: FC<Props> = ({
  label,
  onChangeTemperature,
}) => {
  const {
    state: { conversations },
  } = useContext(HomeContext);
  const lastConversation = conversations[conversations.length - 1];
  const [temperature, setTemperature] = useState(
    lastConversation?.temperature ?? DEFAULT_TEMPERATURE,
  );
  const { t } = useTranslation('chat');
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value);
    setTemperature(newValue);
    onChangeTemperature(newValue);
  };

  return (
    <div className="relative flex flex-col">
      <label className="mb-2 text-left text-neutral-700 dark:text-neutral-400">
        {label}
      </label>
      <span className="text-[12px] text-black/50 dark:text-white/50 text-sm">
        {t(
          'Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.',
        )}
      </span>
      <span className="mt-2 mb-1 text-center text-neutral-900 dark:text-neutral-100">
        {temperature.toFixed(1)}
      </span>
      <input
        className="cursor-pointer"
        type="range"
        min={0}
        max={1}
        step={0.1}
        value={temperature}
        onChange={handleChange}
      />
      <ul className="absolute bottom-[12px] left-0 right-0 flex justify-between px-[8px] text-neutral-900 dark:text-neutral-100">
        <li className="flex justify-center">
          <span>{t('Precise')}</span>
        </li>
        <li className="flex justify-center">
          <span>{t('Neutral')}</span>
        </li>
        <li className="flex justify-center">
          <span>{t('Creative')}</span>
        </li>
      </ul>
      <div className="mt-8"></div> {/* さらに下のコンポーネントとの距離を調整 */}
    </div>
  );
};
