import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import StaffManagement from './StaffManagement';

describe('StaffManagement', () => {
  test('renders staff management title', () => {
    render(<StaffManagement />);
    expect(screen.getByText('Staff Management')).toBeInTheDocument();
  });

  test('renders initial staff members', () => {
    render(<StaffManagement />);
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
  });

  test('form has required fields', () => {
    render(<StaffManagement />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  test('can add new staff member', () => {
    render(<StaffManagement />);
    
    const nameInput = screen.getByLabelText('Name');
    const roleInput = screen.getByLabelText('Role');
    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByText('Add Staff');

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(roleInput, { target: { value: 'Manager' } });
    fireEvent.change(emailInput, { target: { value: 'john@vhbanquets.com' } });

    fireEvent.click(submitButton);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();
  });

  test('has proper accessibility attributes', () => {
    render(<StaffManagement />);
    
    const nameInput = screen.getByLabelText('Name');
    const roleInput = screen.getByLabelText('Role');
    const emailInput = screen.getByLabelText('Email');

    expect(nameInput).toHaveAttribute('id', 'staff-name');
    expect(roleInput).toHaveAttribute('id', 'staff-role');
    expect(emailInput).toHaveAttribute('id', 'staff-email');
  });
});
