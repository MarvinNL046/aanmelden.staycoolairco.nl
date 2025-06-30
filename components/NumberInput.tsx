'use client'

interface Props {
  name: string
  value: number
  onChange: (name: string, value: number) => void
  min?: number
  max?: number
  label: string
  error?: string
}

export default function NumberInput({ 
  name, 
  value, 
  onChange, 
  min = 1, 
  max = 99, 
  label,
  error 
}: Props) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(name, value - 1)
    }
  }

  const handleIncrement = () => {
    if (value < max) {
      onChange(name, value + 1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value)
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(name, newValue)
    } else if (e.target.value === '') {
      onChange(name, min)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="flex items-center">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-l-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Decrease"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <input
          type="number"
          name={name}
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          className={`w-20 px-3 py-2 border-t border-b text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
          inputMode="numeric"
          pattern="[0-9]*"
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-r-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Increase"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  )
}