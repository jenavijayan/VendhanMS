import React, { useState, useEffect, useMemo } from 'react';
import { apiFetchAllUsers } from '../../services/api';
import { User, UserRole } from '../../types';
import { THEME } from '../../constants';
import { UserCircleIcon, SitemapIcon } from '@heroicons/react/24/outline';

interface TreeNode {
  user: User;
  children: TreeNode[];
}

const OrgChartNode: React.FC<{ node: TreeNode }> = ({ node }) => {
  const cardBorderColor = node.user.role === UserRole.ADMIN ? `border-indigo-500` : `border-gray-300`;
  
  return (
    <li>
      <div className={`node-card border-2 ${cardBorderColor}`}>
        {node.user.profilePictureUrl ? (
          <img src={node.user.profilePictureUrl} alt={node.user.username} className="w-16 h-16 rounded-full mx-auto object-cover mb-2" />
        ) : (
          <UserCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-2" />
        )}
        <p className="font-semibold text-gray-800">{node.user.firstName} {node.user.lastName}</p>
        <p className="text-sm text-gray-500">{node.user.department || node.user.role}</p>
      </div>
      {node.children.length > 0 && (
        <ul>
          {node.children.map(child => <OrgChartNode key={child.user.id} node={child} />)}
        </ul>
      )}
    </li>
  );
};


const OrgChart: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadUsers = async () => {
            setLoading(true);
            setError(null);
            try {
                const fetchedUsers = await apiFetchAllUsers();
                setUsers(fetchedUsers);
            } catch (err: any) {
                setError(err.message || 'Failed to load user data for the org chart.');
            } finally {
                setLoading(false);
            }
        };
        loadUsers();
    }, []);

    const orgTree = useMemo(() => {
        const buildTree = (userList: User[]): TreeNode[] => {
            const userMap = new Map<string, TreeNode>();
            const roots: TreeNode[] = [];

            // Initialize each user as a node
            userList.forEach(user => {
                userMap.set(user.id, { user, children: [] });
            });

            // Build the tree structure
            userList.forEach(user => {
                const node = userMap.get(user.id);
                if (node) {
                    if (user.reportsTo && userMap.has(user.reportsTo)) {
                        const parent = userMap.get(user.reportsTo);
                        parent?.children.push(node);
                    } else {
                        roots.push(node);
                    }
                }
            });

            return roots;
        };

        if (users.length > 0) {
            return buildTree(users);
        }
        return [];
    }, [users]);
    
    if (loading) {
        return (
          <div className={`p-6 bg-white rounded-xl shadow-lg text-center text-${THEME.accentText}`}>
            <svg className={`animate-spin h-8 w-8 text-${THEME.primary} mx-auto mb-2`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Building Organization Chart...
          </div>
        );
    }

    if (error) {
        return <div className={`p-6 bg-red-100 text-red-700 rounded-xl shadow-lg`}>Error: {error}</div>;
    }

    return (
        <div className={`p-6 bg-white rounded-xl shadow-lg`}>
            <h2 className={`text-2xl font-semibold text-${THEME.primary} mb-6 flex items-center`}>
                <SitemapIcon className="h-7 w-7 mr-2" />
                Organization Chart
            </h2>

            {orgTree.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                    No users found or hierarchy not set. <br/>
                    Please add users and set their 'Reports To' field in the Manage Employees section.
                </p>
            ) : (
                <div className="org-chart">
                    <ul>
                        {orgTree.map(rootNode => <OrgChartNode key={rootNode.user.id} node={rootNode} />)}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default OrgChart;
