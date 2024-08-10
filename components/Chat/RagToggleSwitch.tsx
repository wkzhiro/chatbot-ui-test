import React, { useEffect, useState, useContext, FC } from 'react';
import CheckboxDialog from './RagCheckboxDialog';
import HomeContext from '@/pages/api/home/home.context';

interface Props {
  label: string;
  isRagChecked: boolean;
  setLocalIsRagChecked:(isRagChecked: boolean) => void;
}

const RagToggleSwitch: React.FC<Props> = ({ label, isRagChecked, setLocalIsRagChecked}) => {
  const {
    state: { 
        ragOptionList =[],
        selectedOptions =[],
     },
    dispatch,
  } = useContext(HomeContext);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchFacets = async () => {
    try {
        const response = await fetch('/api/facet');
        const data = await response.json();
        // console.log(data.tags);
        dispatch({ field: 'ragOptionList', value: data.tags });
        console.log('ragOptionList:',ragOptionList);
    } catch (error) {
        console.error('Error fetching facets:', error);
    }
  };

  const handleToggleChange = async () => {
    const newChecked = !isRagChecked;
    setLocalIsRagChecked(newChecked);
    if (newChecked) {
      fetchFacets();
      setIsDialogOpen(true);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    console.log("selectedOptions;",selectedOptions);
  };

  const handleFruitAreaClick = () => {
    setIsDialogOpen(true);
  };

  return (
    <div className="flex flex-col mt-4">
      <label className="mb-2 text-left text-neutral-700 dark:text-neutral-300">
        {label}
      </label>
      <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
        <input
          type="checkbox"
          name="toggle"
          id="toggle"
          checked={isRagChecked}
          onChange={handleToggleChange}
          className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
        />
        <label
          htmlFor="toggle"
          className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
        ></label>
      </div>

      {selectedOptions.length > 0 && isRagChecked && (
        <div
          className="mt-4 p-4 border border-neutral-200 bg-transparent rounded-lg cursor-pointer relative dark:border-neutral-600"
          onClick={handleFruitAreaClick}
        >
          <span className="absolute top-0 left-2 transform -translate-y-1/2 bg-white px-1 text-sm text-neutral-700 dark:bg-[#343541] dark:text-neutral-400">
            選択したタグ
          </span>
          {selectedOptions.map((option, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm mr-1"
            >
              {option}
            </span>
          ))}
        </div>
      )}

      <CheckboxDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
      />
    </div>
  );
};

export default RagToggleSwitch;
