import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useUser } from "@clerk/clerk-react";
import '../styles/ReportForm.css';

const ReportForm = ({ onReportSubmitted }) => {
  const { user } = useUser();
  const { register, handleSubmit, reset, watch, formState: { isSubmitting, errors } } = useForm();
  const [location, setLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [showOtherCrimeType, setShowOtherCrimeType] = useState(false);

  const crimeType = watch('type');

  useEffect(() => {
    setShowOtherCrimeType(crimeType === 'Other');
  }, [crimeType]);

  const resetForm = useCallback(() => {
    reset();
    setFileName('');
    setLocation(null);
  }, [reset]);

  useEffect(() => {
    if (isFormSubmitted) {
      const timer = setTimeout(() => {
        setIsFormSubmitted(false);
        resetForm();
      }, 3000); // 3 seconds for the success message and CSS effect

      return () => clearTimeout(timer);
    }
  }, [isFormSubmitted, resetForm]);

  const getLocation = () => {
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsGettingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsGettingLocation(false);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  };

  const onSubmit = async (data) => {
    if (!location) {
      alert('Please allow location access to submit a report.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('type', data.type === 'Other' ? data.otherCrimeType : data.type);
      formData.append('description', data.description);
      formData.append('latitude', location.latitude);
      formData.append('longitude', location.longitude);
      formData.append('anonymous', data.anonymous);
      
      if (!data.anonymous) {
        formData.append('userId', user.id);
        formData.append('userEmail', user.primaryEmailAddress.emailAddress);
        formData.append('username', user.fullName);
        // Add any other user data you want to include
      }
      
      if (data.media && data.media[0]) {
        formData.append('media', data.media[0]);
      }

      const response = await axios.post('http://localhost:5050/api/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      onReportSubmitted(response.data);
      setIsFormSubmitted(true);
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };
  
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFileName(e.target.files[0].name);
    } else {
      setFileName('');
    }
  };

  return (
    <div className={`report-form-container ${isFormSubmitted ? 'submitted' : ''}`}>
      <h2>Submit Crime Report</h2>
      {isFormSubmitted ? (
        <div className="form-submitted-message">
          <p>Form submitted successfully!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="report-form">
          <div className="form-group">
            <label htmlFor="type">Crime Type</label>
            <select 
              id="type" 
              {...register('type', { required: 'Crime type is required' })}
            >
              <option value="">Select a crime type</option>
              <option value="Theft">Theft</option>
              <option value="Assault">Assault</option>
              <option value="Burglary">Burglary</option>
              <option value="Vandalism">Vandalism</option>
              <option value="Fraud">Fraud</option>
              <option value="Drug-related">Drug-related</option>
              <option value="Harassment">Harassment</option>
              <option value="Robbery">Robbery</option>
              <option value="Domestic Violence">Domestic Violence</option>
              <option value="Other">Other</option>
            </select>
            {errors.type && <span className="error-message">{errors.type.message}</span>}
          </div>
          {showOtherCrimeType && (
            <div className="form-group">
              <label htmlFor="otherCrimeType">Specify Crime Type</label>
              <input 
                id="otherCrimeType" 
                {...register('otherCrimeType', { required: 'Please specify the crime type' })} 
                placeholder="Enter the specific crime type" 
              />
              {errors.otherCrimeType && <span className="error-message">{errors.otherCrimeType.message}</span>}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea 
              id="description" 
              {...register('description', { required: 'Description is required' })} 
              placeholder="Provide details about the incident" 
            />
            {errors.description && <span className="error-message">{errors.description.message}</span>}
          </div>
          <div className="form-group checkbox-group">
            <input type="checkbox" id="anonymous" {...register('anonymous')} />
            <label htmlFor="anonymous">Report Anonymously</label>
          </div>
          <div className="form-group file-input-group">
            <label htmlFor="media" className="file-input-label">
              {fileName || 'Choose File'}
            </label>
            <input 
              type="file" 
              id="media" 
              {...register('media', { required: 'Media file is required' })} 
              accept="image/,video/" 
              onChange={handleFileChange}
              className="file-input"
            />
            {errors.media && <span className="error-message">{errors.media.message}</span>}
          </div>
          <div className="form-group">
            <button type="button" onClick={getLocation} disabled={isGettingLocation} className="location-btn">
              {isGettingLocation ? 'Getting Location...' : 'Get My Location'}
            </button>
            {location && (
              <p className="location-info">Location fetched: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>
            )}
            {!location && <span className="error-message">Location is required</span>}
          </div>
          <button type="submit" disabled={isSubmitting || !location} className="submit-btn">
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ReportForm;